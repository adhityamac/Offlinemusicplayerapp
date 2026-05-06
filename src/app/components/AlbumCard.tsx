import React from 'react';
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../context/PlayerContext';

type Album = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks: Track[];
};

type AlbumCardProps = {
  album: Album;
};

export function AlbumCard({ album }: AlbumCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  const isCurrentAlbum = currentTrack?.album === album.title;
  
  const handlePlayClick = () => {
    if (isCurrentAlbum) {
      togglePlayPause();
    } else if (album.tracks.length > 0) {
      playTrack(album.tracks[0]);
    }
  };

  return (
    <div className="group bg-gray-900 hover:bg-gray-800/80 p-4 rounded-xl transition-all duration-300 cursor-pointer border border-gray-800 hover:border-gray-700">
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg shadow-lg">
        <img
          src={album.cover}
          alt={album.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayClick();
            }}
            className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 hover:bg-indigo-400 transition-all"
          >
            {isCurrentAlbum && isPlaying ? (
              <div className="w-4 h-4 flex justify-between items-center">
                <div className="w-1.5 h-full bg-white rounded-sm"></div>
                <div className="w-1.5 h-full bg-white rounded-sm"></div>
              </div>
            ) : (
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            )}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-white font-semibold truncate mb-1 text-sm md:text-base">{album.title}</h3>
        <p className="text-gray-400 text-xs md:text-sm truncate">{album.artist}</p>
      </div>
    </div>
  );
}
