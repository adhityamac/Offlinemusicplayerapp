import React from 'react';
import { TAGS, PLAYED, FEATURED_ARTIST_IMAGE } from '../data/mockData';
import { Plus, MoreHorizontal } from 'lucide-react';

export function RightSidebar() {
  return (
    <div className="w-[320px] bg-[#1F143A] flex flex-col h-full shrink-0 relative z-20 py-8 px-6 overflow-y-auto custom-scrollbar rounded-r-[2.5rem]">
      
      {/* Tags Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Tags</h2>
          <button className="text-[#8B7EB3] hover:text-white">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button 
              key={tag.id}
              className="bg-[#291B4C] hover:bg-[#342360] transition-colors text-white text-xs font-medium px-4 py-2 rounded-full"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Played Section */}
      <div className="mb-10 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">Played</h2>
          <button className="text-[#8B7EB3] hover:text-white text-xs font-medium">
            See all
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {PLAYED.map(song => (
            <div key={song.id} className="flex items-center gap-3 group cursor-pointer">
              <img 
                src={song.cover} 
                alt={song.title} 
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate group-hover:text-[#20D670] transition-colors">
                  {song.title}
                </h4>
                <p className="text-[#8B7EB3] text-xs truncate">
                  {song.artist}
                </p>
              </div>
              <span className="text-[#8B7EB3] text-xs shrink-0">{song.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Now Playing Featured Card */}
      <div className="mt-auto">
        <div className="bg-[#2A1B4E] rounded-3xl p-3 shadow-2xl relative overflow-hidden">
          {/* Card Content */}
          <div className="relative rounded-2xl overflow-hidden mb-3 aspect-square">
            <img 
              src={FEATURED_ARTIST_IMAGE} 
              alt="Lover" 
              className="w-full h-full object-cover"
            />
            {/* Title inside the image if needed, but it seems outside in the image */}
          </div>
          
          <div className="px-2 pb-2 flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-white font-bold truncate">I Knew You Were</h3>
              <p className="text-[#8B7EB3] text-xs truncate">Taylor Swift</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-[#1F143A] flex items-center justify-center text-white hover:bg-[#2A1B4E] transition-colors shrink-0 border border-white/5">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
