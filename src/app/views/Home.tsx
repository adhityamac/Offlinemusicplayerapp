import React from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { PLAYLIST, HERO_IMAGE } from '../data/mockData';
import { PlayerBar } from '../components/PlayerBar';
import { usePlayer } from '../context/PlayerContext';

export function Home() {
  const { togglePlayPause } = usePlayer();

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Top Nav */}
      <header className="px-8 pt-8 pb-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-[#1A1130] flex items-center justify-center text-white hover:bg-[#2A1B4E] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-8 h-8 rounded-full bg-[#1A1130] flex items-center justify-center text-white hover:bg-[#2A1B4E] transition-colors opacity-50 cursor-not-allowed">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-40">
        
        {/* Trending Section */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[#8B7EB3] text-sm">What's hot</p>
              <h1 className="text-3xl font-bold text-white tracking-tight">Trending</h1>
            </div>
            <button className="text-[#8B7EB3] hover:text-white text-sm font-medium">
              More &gt;
            </button>
          </div>

          {/* Hero Card */}
          <div className="relative rounded-3xl overflow-hidden bg-[#2A1B4E] h-[280px]">
            <img 
              src={HERO_IMAGE} 
              alt="Trending Artist" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#221644]/90 via-[#221644]/60 to-transparent p-8 flex flex-col justify-between">
              <div className="flex justify-between">
                <span className="text-white font-medium">Artist</span>
                <div className="text-right">
                  <span className="text-[#8B7EB3] text-xs block">Monthly listener</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full" /> 98.029
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-5xl font-bold text-white mb-6 max-w-sm leading-tight">
                  Top all over the world
                </h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={togglePlayPause}
                    className="bg-[#FF3454] hover:bg-[#FF4A67] text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,52,84,0.4)]"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Play
                  </button>
                  <button className="border border-white/20 hover:bg-white/10 text-white px-8 py-3 rounded-full font-bold transition-colors">
                    Follow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Playlist</h2>
            <button className="text-[#8B7EB3] hover:text-white text-sm font-medium">
              Show all
            </button>
          </div>

          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-[3rem_minmax(150px,1fr)_minmax(100px,1fr)_4rem_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/5 text-[10px] font-semibold text-[#8B7EB3] tracking-wider mb-2 uppercase">
              <div>#</div>
              <div>Title</div>
              <div>Artist</div>
              <div>Time</div>
              <div>Album</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col gap-1">
              {PLAYLIST.map((track, index) => {
                const isActive = index === 1; // Hardcoding 2nd track as active for the concept
                return (
                  <div 
                    key={track.id} 
                    className={`grid grid-cols-[3rem_minmax(150px,1fr)_minmax(100px,1fr)_4rem_minmax(120px,1fr)] gap-4 px-4 py-3 items-center rounded-xl cursor-pointer transition-colors ${
                      isActive ? 'bg-[#3A2766]' : 'hover:bg-[#2A1B4E]'
                    }`}
                  >
                    <div className="text-[#8B7EB3] text-xs font-medium">
                      {isActive ? (
                        <div className="flex gap-[3px] items-end h-3 w-4">
                          <div className="w-[3px] bg-white h-[8px] animate-[bounce_1s_infinite]" style={{animationDelay: '0ms'}} />
                          <div className="w-[3px] bg-white h-[12px] animate-[bounce_1.2s_infinite]" style={{animationDelay: '150ms'}} />
                          <div className="w-[3px] bg-white h-[6px] animate-[bounce_0.8s_infinite]" style={{animationDelay: '300ms'}} />
                        </div>
                      ) : (
                        track.num
                      )}
                    </div>
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-[#8B7EB3]'}`}>
                      {track.title}
                    </div>
                    <div className={`text-sm truncate ${isActive ? 'text-white' : 'text-[#8B7EB3]'}`}>
                      {track.artist}
                    </div>
                    <div className="text-[#8B7EB3] text-sm">
                      {track.time}
                    </div>
                    <div className="text-[#8B7EB3] text-sm truncate">
                      {track.album}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      <PlayerBar />
    </div>
  );
}
