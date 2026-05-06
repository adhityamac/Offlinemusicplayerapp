import React from 'react';
import { Heart, Plus, ListMusic } from 'lucide-react';

export function Playlists() {
  const playlists = [
    { id: 1, name: 'Liked Songs', count: 142, coverClass: 'bg-gradient-to-br from-indigo-500 to-purple-600', icon: <Heart className="w-8 h-8 text-white fill-current" /> },
    { id: 2, name: 'Driving Vibes', count: 45, coverClass: 'bg-gradient-to-br from-emerald-400 to-cyan-500', icon: <ListMusic className="w-8 h-8 text-white" /> },
    { id: 3, name: 'Focus Flow', count: 28, coverClass: 'bg-gradient-to-br from-orange-400 to-rose-500', icon: <ListMusic className="w-8 h-8 text-white" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50 px-8 h-20 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Playlists</h2>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="group cursor-pointer">
              <div className={`aspect-square rounded-xl ${playlist.coverClass} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 mb-4`}>
                {playlist.icon}
              </div>
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">{playlist.name}</h3>
              <p className="text-gray-400 text-xs md:text-sm">{playlist.count} songs</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
