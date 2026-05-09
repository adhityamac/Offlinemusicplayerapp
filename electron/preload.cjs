const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getLibrary: () => ipcRenderer.invoke('get-library'),
  setMiniPlayer: (isMini) => ipcRenderer.send('set-mini-player', isMini),
  parseFiles: (filePaths) => ipcRenderer.invoke('parse-files', filePaths),
  updateMetadata: (filePath, tags) => ipcRenderer.invoke('update-metadata', filePath, tags)
});
