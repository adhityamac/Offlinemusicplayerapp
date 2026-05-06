import React, { useState, useRef } from 'react';
import { Music, Play, Pause, Clock, Search, FolderOpen, Upload, Shuffle, AlignJustify, LayoutGrid, Loader2 } from 'lucide-react';
import { PlayerBar } from '../components/PlayerBar';
import { usePlayer } from '../context/PlayerContext';

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type SortKey = 'title' | 'artist' | 'album' | 'duration';
type ViewMode = 'list' | 'grid';

export function Home() {
  const {
    tracks,
    loadFiles,
    isLoading,
    clearLibrary,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleShuffle,
    isShuffled,
    accentColor,
  } = usePlayer();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      loadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = tracks
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const av = (a[sortKey] ?? '').toString().toLowerCase();
      const bv = (b[sortKey] ?? '').toString().toLowerCase();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);

  // Empty state
  if (tracks.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          {/* Big import zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-md border-2 border-dashed border-[#291B4C] hover:border-[#8B5CF6]/50 rounded-3xl p-12 flex flex-col items-center gap-5 cursor-pointer transition-all group hover:bg-[#8B5CF6]/5"
          >
            <div className="w-20 h-20 rounded-3xl bg-[#1D1540]/80 flex items-center justify-center group-hover:bg-[#291B4C] transition-all shadow-xl">
              <Upload className="w-8 h-8 text-[#6B5F9E] group-hover:text-[#A78BFA] transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-white text-base font-medium mb-1">Drop music here</p>
              <p className="text-[#6B5F9E] text-sm">or click to browse files</p>
              <p className="text-[#4B3F7A] text-xs mt-2">MP3 · FLAC · WAV · M4A · AAC</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px w-16 bg-[#291B4C]" />
            <span className="text-[#4B3F7A] text-xs">or</span>
            <div className="h-px w-16 bg-[#291B4C]" />
          </div>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#1D1540]/80 hover:bg-[#291B4C] border border-white/8 text-[#8B7EB3] hover:text-white text-sm font-medium transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            Import entire folder
          </button>
        </div>

        <PlayerBar />

        <input ref={fileInputRef} type="file" accept=".mp3,.flac,.wav,.m4a,.aac,.ogg" multiple className="hidden" onChange={handleFileChange} />
        <input ref={folderInputRef} type="file" accept=".mp3,.flac,.wav,.m4a,.aac,.ogg" multiple
          // @ts-ignore
          webkitdirectory="" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  if (tracks.length === 0 && isLoading) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          <p className="text-[#8B7EB3] text-sm">Importing your music...</p>
        </div>
        <PlayerBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4 border-b border-white/5">
        <div className="flex-1">
          <h1 className="text-white text-xl font-semibold tracking-tight">Library</h1>
          {tracks.length > 0 && (
            <p className="text-[#6B5F9E] text-xs mt-0.5">
              {tracks.length} songs
              {totalHours > 0 ? ` · ${totalHours}h ${totalMins}m` : totalMins > 0 ? ` · ${totalMins}m` : ''}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5F9E]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-[#1D1540]/80 text-white placeholder-[#6B5F9E] rounded-xl py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/40 border border-white/5 w-44 transition-all"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => tracks.length > 0 && playTrack(tracks[Math.floor(Math.random() * tracks.length)], tracks)}
            className="p-1.5 rounded-lg text-[#6B5F9E] hover:text-white hover:bg-[#1D1540] transition-all"
            title="Shuffle all"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
            className="p-1.5 rounded-lg text-[#6B5F9E] hover:text-white hover:bg-[#1D1540] transition-all"
          >
            {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <AlignJustify className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-36 custom-scrollbar">
        {viewMode === 'list' ? (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2rem_minmax(180px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_3.5rem] gap-3 px-6 py-2.5 border-b border-white/5 sticky top-0 bg-[#221644]/95 backdrop-blur-md z-10">
              {(['#', 'title', 'artist', 'album', ''] as const).map((col, i) => (
                <button
                  key={i}
                  onClick={() => i > 0 && i < 4 && handleSort(['title', 'title', 'artist', 'album', 'duration'][i] as SortKey)}
                  className={`text-left text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    sortKey === ['', 'title', 'artist', 'album', ''][i]
                      ? 'text-[#A78BFA]'
                      : 'text-[#4B3F7A] hover:text-[#8B7EB3]'
                  }`}
                >
                  {col === 'title' ? 'Title' : col === 'artist' ? 'Artist' : col === 'album' ? 'Album' : col === '#' ? '#' : <Clock className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            <div className="flex flex-col">
              {filtered.map((track, idx) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onDoubleClick={() => playTrack(track, filtered)}
                    className={`grid grid-cols-[2rem_minmax(180px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_3.5rem] gap-3 px-6 py-2.5 items-center cursor-pointer group transition-all ${
                      isActive ? 'bg-[#8B5CF6]/10' : 'hover:bg-[#1D1540]/60'
                    }`}
                  >
                    {/* Index / playing indicator */}
                    <div className="flex items-center justify-start">
                      {isActive ? (
                        <button onClick={togglePlayPause}>
                          {isPlaying ? (
                            <div className="flex gap-px items-end h-3.5 w-3.5">
                              {[8, 12, 6].map((h, i) => (
                                <div key={i} className="w-0.5 rounded-sm animate-bounce"
                                  style={{ height: `${h}px`, backgroundColor: accentColor, animationDelay: `${i * 120}ms`, animationDuration: `${0.8 + i * 0.15}s` }} />
                              ))}
                            </div>
                          ) : (
                            <Pause className="w-3.5 h-3.5" style={{ color: accentColor }} />
                          )}
                        </button>
                      ) : (
                        <span className="text-[#4B3F7A] text-xs font-mono group-hover:hidden">{idx + 1}</span>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => playTrack(track, filtered)}
                          className="hidden group-hover:flex text-white"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>

                    {/* Title + cover */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        {track.cover ? (
                          <img src={track.cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#1D1540] flex items-center justify-center">
                            <Music className="w-3.5 h-3.5 text-[#4B3F7A]" />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-[#C4B5FD] group-hover:text-white'}`}>
                        {track.title}
                      </span>
                    </div>

                    <span className="text-xs text-[#6B5F9E] truncate">{track.artist}</span>
                    <span className="text-xs text-[#4B3F7A] truncate">{track.album}</span>
                    <span className="text-[11px] text-[#4B3F7A] font-mono text-right">{formatTime(track.duration)}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          // Grid mode
          <div className="p-6 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {filtered.map((track) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => isActive ? togglePlayPause() : playTrack(track, filtered)}
                  className="group cursor-pointer"
                >
                  <div className={`aspect-square rounded-2xl overflow-hidden mb-2.5 shadow-lg relative transition-all ${isActive ? 'ring-2 ring-offset-2 ring-offset-[#221644]' : ''}`}
                    style={isActive ? { ringColor: accentColor } : {}}>
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#291B4C] to-[#1D1540] flex items-center justify-center">
                        <Music className="w-8 h-8 text-[#6B5F9E]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isActive && isPlaying ? (
                        <Pause className="w-7 h-7 fill-current text-white" />
                      ) : (
                        <Play className="w-7 h-7 fill-current text-white ml-1" />
                      )}
                    </div>
                  </div>
                  <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-[#C4B5FD]'}`}>{track.title}</p>
                  <p className="text-[10px] text-[#6B5F9E] truncate">{track.artist}</p>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && search && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-8 h-8 text-[#4B3F7A]" />
            <p className="text-[#6B5F9E] text-sm">No results for "{search}"</p>
          </div>
        )}
      </div>

      <PlayerBar />
    </div>
  );
}