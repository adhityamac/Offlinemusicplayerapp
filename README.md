# her. 🎶

**her.** is a beautiful, modern, and highly interactive desktop music player designed for a premium audio experience.

![Music Player UI](https://github.com/adhityamac/Offlinemusicplayerapp/raw/master/public/vinyl.jpg)

## Features

- **Beautiful UI/UX:** A stunning glassmorphic design that adapts to the album art of the currently playing track.
- **Interactive Vinyl Player:** A uniquely designed 3D-styled vinyl disc that revolves smoothly while a song is playing. 
- **Offline Library Management:** Easily load your local MP3 files, browse by album, artist, or folder, and build your ultimate personal library.
- **Dynamic Playlists:** Create custom playlists, mark your favorite tracks, and organize your music flawlessly.
- **Advanced Audio Controls:** Smooth sliders, volume control, customizable EQ, and rich playback controls.
- **Desktop First:** Built with Electron to run seamlessly on your Windows desktop. 

## Installation & Running

### Using the Pre-built `.exe` Installer

A fully packaged Windows installer is automatically generated when you build the project.
1. Build the app using the instructions below.
2. Navigate to the `dist-electron` folder.
3. You will find the installer file: `her Setup 0.0.1.exe`.
4. Double-click to install the app natively on your Windows PC!

*Note: The `.exe` file is over 100MB and thus is not pushed directly to this GitHub repository due to GitHub's file size limits. You can build it locally at any time!*

### Running from Source

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development version (Electron):**
   ```bash
   npm run electron:dev
   ```

3. **Build the production application (`.exe`):**
   ```bash
   npm run electron:build
   ```

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Desktop Framework:** Electron, Vite
- **UI Components:** Radix UI, Lucide Icons, Shadcn UI patterns