import React, { useRef, useCallback } from 'react';
import {
  Heart,
  Play,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Visualizer } from './Visualizer';

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
    accentColor,
  } = usePlayer();

  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const draggingProgress = useRef(false);
  const draggingVolume = useRef(false);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Progress bar seek
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  }, [duration, seek]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    draggingProgress.current = true;
    handleProgressClick(e);

    const onMove = (me: MouseEvent) => {
      if (!draggingProgress.current || !progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
      seek(pct * duration);
    };
    const onUp = () => {
      draggingProgress.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [handleProgressClick, duration, seek]);

  // Volume bar
  const handleVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    draggingVolume.current = true;
    const update = (me: MouseEvent | React.MouseEvent) => {
      if (!volumeRef.current) return;
      const rect = volumeRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
      setVolume(Math.round(pct * 100));
    };
    update(e);
    const onMove = (me: MouseEvent) => { if (draggingVolume.current) update(me); };
    const onUp = () => {
      draggingVolume.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [setVolume]);

  return (
    <div className="absolute bottom-5 left-6 right-6 bg-[#1D1540]/90 backdrop-blur-xl rounded-2xl border border-white/8 shadow-2xl shadow-black/50 z-50 px-5 py-4">

      {/* Progress bar — full width at top */}
      <div
        ref={progressRef}
        className="w-full h-1 bg-[#291B4C] rounded-full cursor-pointer mb-4 relative group"
        onMouseDown={handleProgressMouseDown}
        onClick={handleProgressClick}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-none"
          style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${accentColor}, #A78BFA)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `calc(${progressPercent}% - 5px)` }}
        />
      </div>

      <div className="flex items-center gap-4">

        {/* Left: Track info */}
        <div className="flex items-center gap-3 w-[220px] shrink-0">
          {currentTrack ? (
            <>
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-lg">
                {currentTrack.cover ? (
                  <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${accentColor}80, ${accentColor}40)` }}
                  >
                    <Music className="w-4 h-4 text-white/70" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate leading-tight">{currentTrack.title}</p>
                <p className="text-[#8B7EB3] text-[11px] truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button className="text-[#6B5F9E] hover:text-[#EC4899] transition-colors ml-1 shrink-0">
                <Heart className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#291B4C]/60 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-[#6B5F9E]" />
              </div>
              <div>
                <p className="text-[#6B5F9E] text-xs">No track selected</p>
                <p className="text-[#4B3F7A] text-[10px]">Import music to start</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-5">
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${isShuffled ? 'text-[#A78BFA]' : 'text-[#6B5F9E] hover:text-white'}`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={playPrevious}
              className="text-white/70 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1D1540] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
              style={{ boxShadow: currentTrack ? `0 0 20px ${accentColor}40` : undefined }}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="text-white/70 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`transition-colors ${repeatMode !== 'none' ? 'text-[#A78BFA]' : 'text-[#6B5F9E] hover:text-white'}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Time stamps */}
          <div className="flex items-center gap-2 w-full max-w-xs">
            <span className="text-[#6B5F9E] text-[10px] font-mono w-7 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <span className="text-[#4B3F7A] text-[10px] mx-0.5">·</span>
            <span className="text-[#6B5F9E] text-[10px] font-mono w-7 shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume + Visualizer */}
        <div className="w-[220px] shrink-0 flex items-center justify-end gap-3">
          {/* Visualizer */}
          <Visualizer width={70} height={22} barCount={12} />

          {/* Volume */}
          <button onClick={toggleMute} className="text-[#6B5F9E] hover:text-white transition-colors shrink-0">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div
            ref={volumeRef}
            className="w-20 h-1 bg-[#291B4C] rounded-full relative cursor-pointer group"
            onMouseDown={handleVolumeMouseDown}
          >
            <div
              className="absolute left-0 top-0 h-full bg-white/60 rounded-full"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${isMuted ? 0 : volume}% - 5px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
