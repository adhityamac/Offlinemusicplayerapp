const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const NodeID3 = require('node-id3');

let mainWindow;
let tray = null;
const libraryPath = path.join(app.getPath('userData'), 'sonance-library.json');

// Dynamic import for ESM package
async function parseFileMetadata(filePath) {
  const mm = await import('music-metadata');
  try {
    const metadata = await mm.parseFile(filePath, { duration: true, skipCovers: false });
    
    let coverArt = null;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      coverArt = `data:${pic.format || 'image/jpeg'};base64,${pic.data.toString('base64')}`;
    }

    return {
      id: crypto.createHash('md5').update(filePath).digest('hex'),
      title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
      artist: metadata.common.artist || metadata.common.albumartist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration || 0,
      coverArt: coverArt,
      fileUrl: `file://${filePath.replace(/\\/g, '/')}`,
      filePath: filePath,
      lyrics: metadata.common.lyrics ? metadata.common.lyrics.join('\n') : null
    };
  } catch (error) {
    console.error(`Failed to parse metadata for ${filePath}`, error);
    return null;
  }
}

async function scanDirectory(dir) {
  const audioFiles = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await scanDirectory(fullPath);
        audioFiles.push(...subFiles);
      } else if (/\.(mp3|flac|wav|m4a|aac)$/i.test(entry.name)) {
        audioFiles.push(fullPath);
      }
    }
  } catch (e) {
    console.error('Error scanning directory', e);
  }
  return audioFiles;
}

async function loadLibrary() {
  try {
    const data = await fs.readFile(libraryPath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveLibrary(library) {
  await fs.writeFile(libraryPath, JSON.stringify(library), 'utf-8');
}

function createTray() {
  // Use a simple icon or a transparent pixel if no icon exists yet
  // In production, you would point this to an actual .ico or .png
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Player', click: () => mainWindow.show() },
    { label: 'Play/Pause', click: () => mainWindow.webContents.send('media-play-pause') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Sonance Music Player');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 150,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Necessary to load local file:// URLs from the renderer
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden', // Modern frameless look
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#ffffff',
      height: 32
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    // Minimize to tray instead of quitting if we aren't explicitly exiting
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Retrieve library on startup
ipcMain.handle('get-library', async () => {
  return await loadLibrary();
});

// IPC: Select a folder, scan for music, parse metadata, save, and return it
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null; // User cancelled
  }

  const selectedDir = result.filePaths[0];
  const filePaths = await scanDirectory(selectedDir);
  
  const library = await loadLibrary();
  const existingPaths = new Set(library.map(t => t.filePath));

  const newTracks = [];
  for (const fp of filePaths) {
    if (!existingPaths.has(fp)) {
      const track = await parseFileMetadata(fp);
      if (track) {
        newTracks.push(track);
        library.push(track);
      }
    }
  }

  if (newTracks.length > 0) {
    await saveLibrary(library);
  }

  return library;
});

// IPC: Toggle mini-player layout
ipcMain.on('set-mini-player', (event, isMini) => {
  if (isMini) {
    mainWindow.setContentSize(360, 400, true);
    mainWindow.setAlwaysOnTop(true);
  } else {
    mainWindow.setContentSize(1200, 800, true);
    mainWindow.setAlwaysOnTop(false);
  }
});

// IPC: Parse specific files from drag and drop
ipcMain.handle('parse-files', async (event, filePaths) => {
  const library = await loadLibrary();
  const existingPaths = new Set(library.map(t => t.filePath));
  
  const newTracks = [];
  for (const fp of filePaths) {
    if (!existingPaths.has(fp)) {
      const track = await parseFileMetadata(fp);
      if (track) {
        newTracks.push(track);
        library.push(track);
      }
    }
  }
  
  if (newTracks.length > 0) {
    await saveLibrary(library);
  }
  
  return newTracks;
});

// IPC: Update ID3 Metadata
ipcMain.handle('update-metadata', async (event, filePath, tags) => {
  // tags can include { title, artist, album, genre }
  // To write cover art, node-id3 expects { image: "path/to/image" } or { image: Buffer }
  // We'll handle basic text tags for now, and cover image if it's a valid local path.
  try {
    const id3Tags = {
      title: tags.title,
      artist: tags.artist,
      album: tags.album,
      genre: tags.genre
    };
    
    // If a new cover path is provided and it's a valid local file
    if (tags.coverPath && !tags.coverPath.startsWith('data:')) {
      id3Tags.image = tags.coverPath;
    }

    const success = NodeID3.update(id3Tags, filePath);
    if (!success) {
      console.error('Failed to update ID3 tags for', filePath);
      return { success: false, error: 'Update failed' };
    }

    // Update our library.json
    const library = await loadLibrary();
    const index = library.findIndex(t => t.filePath === filePath);
    if (index !== -1) {
      const newMeta = await parseFileMetadata(filePath);
      if (newMeta) {
        library[index] = newMeta;
        await saveLibrary(library);
        return { success: true, track: newMeta };
      }
    }
    return { success: false, error: 'File not in library' };
  } catch (error) {
    console.error('Error updating metadata:', error);
    return { success: false, error: error.message };
  }
});
