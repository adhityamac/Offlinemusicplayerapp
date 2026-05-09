import React, { useState } from 'react';
import { Heart, ListMusic, Plus, Music } from 'lucide-react';
import { PlayerBar } from '../components/PlayerBar';
import { usePlayer } from '../context/PlayerContext';

type Playlist = {
  id: number;
  name: string;
  gradient: string;
  tracks: string[];
};

export function Playlists() {
  const { tracks } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 1, name: 'Liked Songs', gradient: 'from-[#8B5CF6] to-[#6D28D9]', tracks: [] },
    { id: 2, name: 'Late Night', gradient: 'from-[#1E40AF] to-[#4338CA]', tracks: [] },
    { id: 3, name: 'Focus Flow', gradient: 'from-[#059669] to-[#0891B2]', tracks: [] },
    { id: 4, name: 'Mood Lifter', gradient: 'from-[#EC4899] to-[#8B5CF6]', tracks: [] },
  ]);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const createPlaylist = () => {
    if (!newName.trim()) return;
    const gradients = [
      'from-[#8B5CF6] to-[#EC4899]',
      'from-[#10B981] to-[#3B82F6]',
      'from-[#F59E0B] to-[#EF4444]',
      'from-[#06B6D4] to-[#8B5CF6]',
    ];
    setPlaylists(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      gradient: gradients[prev.length % gradients.length],
      tracks: [],
    }]);
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      <header className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">Playlists</h1>
          <p className="text-[#6B5F9E] text-xs mt-0.5">{playlists.length} playlists</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A78BFA] text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Playlist
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-36 custom-scrollbar">

        {/* Create new playlist */}
        {creating && (
          <div className="mb-6 bg-[#1A1130] rounded-2xl p-4 flex items-center gap-3 border border-[#8B5CF6]/30">
            <div className="w-12 h-12 rounded-xl bg-[#1D1540] flex items-center justify-center shrink-0">
              <ListMusic className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createPlaylist()}
              placeholder="Playlist name..."
              className="flex-1 bg-transparent text-white text-sm placeholder-[#4B3F7A] focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                onClick={createPlaylist}
                className="px-3 py-1 rounded-lg bg-[#8B5CF6] text-white text-xs font-medium hover:bg-[#7C3AED] transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(''); }}
                className="px-3 py-1 rounded-lg bg-[#1D1540] text-[#8B7EB3] text-xs font-medium hover:bg-[#291B4C] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Playlist grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="group cursor-pointer">
              <div className={`aspect-square rounded-2xl bg-gradient-to-br ${playlist.gradient} flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl mb-3 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                </div>
                {playlist.name === 'Liked Songs' ? (
                  <Heart className="w-10 h-10 text-white fill-current" />
                ) : (
                  <ListMusic className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-white text-sm font-medium truncate group-hover:text-[#C4B5FD] transition-colors">{playlist.name}</h3>
              <p className="text-[#6B5F9E] text-xs mt-0.5">{playlist.tracks.length} songs</p>
            </div>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="mt-8 p-4 rounded-2xl bg-[#1A1130] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 flex items-center justify-center shrink-0 mt-0.5">
              <Music className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-[#8B7EB3] text-xs font-medium">No music imported yet</p>
              <p className="text-[#4B3F7A] text-[11px] mt-0.5">Import your music library to add songs to playlists</p>
            </div>
          </div>
        )}
      </div>

      <PlayerBar />
    </div>
  );
}
