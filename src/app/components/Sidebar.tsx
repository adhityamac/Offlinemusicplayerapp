import React, { useRef } from 'react';
import { NavLink } from 'react-router';
import {
  Music2,
  ListMusic,
  Settings,
  Library,
  Search,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export function Sidebar() {
  const { loadFiles, isLoading, tracks, loadingProgress } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const libraryItems = [
    { to: '/', label: 'Library', icon: <Library className="w-4 h-4" />, end: true },
    { to: '/playlists', label: 'Playlists', icon: <ListMusic className="w-4 h-4" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="w-[220px] bg-[#130D28] flex flex-col h-full shrink-0 relative z-20 rounded-l-[2.5rem] border-r border-white/5">

      {/* Window chrome */}
      <div className="flex gap-2 p-5 pb-0">
        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-6">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-violet-900/40">
          <Music2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-white text-base font-semibold tracking-tight">Sonance</span>
      </div>

      {/* Search */}
      <div className="px-4 mb-5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5F9E]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#1D1540]/80 text-white placeholder-[#6B5F9E] rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/40 transition-all border border-white/5"
          />
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[#6B5F9E] text-[10px] font-medium uppercase tracking-widest px-3 mb-2">Browse</p>
        <nav className="flex flex-col gap-0.5">
          {libraryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#8B5CF6]/15 text-white'
                    : 'text-[#8B7EB3] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#8B5CF6] rounded-r-full" />
                  )}
                  <span className={isActive ? 'text-[#A78BFA]' : 'text-[#6B5F9E]'}>{item.icon}</span>
                  {item.label}
                  {item.to === '/' && tracks.length > 0 && (
                    <span className="ml-auto text-[#6B5F9E] text-[10px] font-mono">{tracks.length}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Import music */}
      <div className="p-4 border-t border-white/5">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2 text-[#8B7EB3] text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Importing... {loadingProgress}%</span>
            </div>
            <div className="w-full bg-[#1D1540] rounded-full h-1">
              <div
                className="bg-[#8B5CF6] h-1 rounded-full transition-all duration-200"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] text-xs font-medium transition-all"
            >
              <Music2 className="w-3.5 h-3.5" />
              Import Files
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-[#1D1540]/80 hover:bg-[#291B4C] text-[#8B7EB3] text-xs font-medium transition-all border border-white/5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Import Folder
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.flac,.wav,.m4a,.aac,.ogg,.opus"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept=".mp3,.flac,.wav,.m4a,.aac,.ogg,.opus"
        multiple
        // @ts-ignore
        webkitdirectory=""
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
