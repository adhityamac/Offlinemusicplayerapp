import React from 'react';
import { Heart, Maximize2, PictureInPicture, Play, Pause, Repeat, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export function PlayerBar() {
  const { isPlaying, togglePlayPause } = usePlayer();

  return (
    <div className="absolute bottom-6 left-8 right-8 bg-[#2A1B4E] rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl z-50">
      
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-4 w-1/4">
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
            <PictureInPicture className="w-5 h-5" />
          </button>
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center justify-center gap-6 w-2/4">
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
            <Shuffle className="w-4 h-4" />
          </button>
          <button className="text-white hover:text-[#20D670] transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#2A1B4E] hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-1" />
            )}
          </button>

          <button className="text-white hover:text-[#20D670] transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right Volume */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="w-24 h-1 bg-[#1F143A] rounded-full relative">
            <div className="absolute left-0 top-0 h-full bg-white rounded-full w-2/3" />
            <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
          </div>
          <button className="text-[#8B7EB3] hover:text-white transition-colors">
             <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-[#8B7EB3] text-[10px] w-8 text-right">1:16</span>
        <div className="flex-1 h-1 bg-[#1F143A] rounded-full relative cursor-pointer">
          <div className="absolute left-0 top-0 h-full bg-white rounded-full w-1/3" />
          <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
        </div>
        <span className="text-[#8B7EB3] text-[10px] w-8">4:20</span>
      </div>

    </div>
  );
}
