import React, { useState } from 'react';
import { ListMusic, Music, Play, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RightSidebar() {
  const { queue, queueIndex, currentTrack, isPlaying, playTrack, accentColor } = usePlayer();
  const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');

  // Show queue context: a few tracks before and after current
  const displayQueue = queue.slice(Math.max(0, queueIndex), queueIndex + 30);

  return (
    <div className="w-[260px] bg-[#130D28] flex flex-col h-full shrink-0 relative z-20 rounded-r-[2.5rem] border-l border-white/5">

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex gap-1 bg-[#1D1540]/60 rounded-xl p-1">
          {(['queue', 'recent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#291B4C] text-white shadow-sm'
                  : 'text-[#6B5F9E] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Now Playing mini card */}
      {currentTrack && (
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, ${accentColor}, transparent)` }}
          />
          <div className="relative p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg">
              {currentTrack.cover ? (
                <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accentColor}60, ${accentColor}20)` }}
                >
                  <Music className="w-5 h-5 text-white/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{currentTrack.title}</p>
              <p className="text-[#8B7EB3] text-[11px] truncate mt-0.5">{currentTrack.artist}</p>
              <div className="flex items-center gap-1 mt-1">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-[10px]" style={{ color: accentColor }}>
                  {isPlaying ? 'Playing' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {activeTab === 'queue' && (
          <>
            {displayQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#1D1540]/60 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-[#6B5F9E]" />
                </div>
                <div>
                  <p className="text-[#8B7EB3] text-xs">Queue is empty</p>
                  <p className="text-[#4B3F7A] text-[10px] mt-0.5">Play a track to start</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {displayQueue.map((track, idx) => {
                  const absoluteIdx = Math.max(0, queueIndex) + idx;
                  const isActive = absoluteIdx === queueIndex;
                  return (
                    <button
                      key={track.id + idx}
                      onClick={() => playTrack(track)}
                      className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-all group ${
                        isActive
                          ? 'bg-[#291B4C]/80'
                          : 'hover:bg-[#1D1540]/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        {track.cover ? (
                          <img src={track.cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)` }}
                          >
                            <Music className="w-3 h-3 text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-medium truncate ${isActive ? 'text-white' : 'text-[#8B7EB3] group-hover:text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-[10px] text-[#6B5F9E] truncate">{track.artist}</p>
                      </div>
                      <div className="shrink-0">
                        {isActive && isPlaying ? (
                          <div className="flex gap-px items-end h-3">
                            {[6, 10, 7].map((h, i) => (
                              <div
                                key={i}
                                className="w-0.5 rounded-sm animate-pulse"
                                style={{
                                  height: `${h}px`,
                                  backgroundColor: accentColor,
                                  animationDelay: `${i * 100}ms`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#4B3F7A] font-mono">
                            {formatTime(track.duration)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'recent' && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1D1540]/60 flex items-center justify-center">
              <Music className="w-5 h-5 text-[#6B5F9E]" />
            </div>
            <p className="text-[#8B7EB3] text-xs">Recent plays tracked<br />this session</p>
          </div>
        )}
      </div>

      {/* Footer: keyboard shortcuts hint */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-[#4B3F7A] text-[10px] text-center leading-relaxed">
          Space to play · ⌥← → skip · M mute
        </p>
      </div>
    </div>
  );
}
