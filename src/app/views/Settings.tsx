import React, { useState } from 'react';
import { Trash2, Info, Keyboard, Volume2, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { EQPanel } from '../components/EQPanel';
import { PlayerBar } from '../components/PlayerBar';

export function Settings() {
  const { tracks, clearLibrary, volume, setVolume } = usePlayer();
  const [crossfade, setCrossfade] = useState(0);
  const [normalization, setNormalization] = useState(true);
  const [gapless, setGapless] = useState(true);

  return (
    <div className="flex flex-col h-full relative">
      <header className="px-6 pt-6 pb-4 border-b border-white/5">
        <h1 className="text-white text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[#6B5F9E] text-xs mt-0.5">App preferences & audio configuration</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-36 custom-scrollbar">
        <div className="max-w-xl space-y-6">

          {/* Equalizer */}
          <section>
            <h2 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
              Equalizer
            </h2>
            <EQPanel />
          </section>

          {/* Playback */}
          <section>
            <h2 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-[#8B5CF6]" />
              Playback
            </h2>
            <div className="bg-[#1A1130] rounded-2xl divide-y divide-white/5 overflow-hidden">

              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-white text-xs font-medium">Volume Normalization</h3>
                  <p className="text-[#6B5F9E] text-[11px] mt-0.5">Automatically balance track levels</p>
                </div>
                <button
                  onClick={() => setNormalization(p => !p)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${normalization ? 'bg-[#8B5CF6]' : 'bg-[#291B4C]'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${normalization ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-white text-xs font-medium">Gapless Playback</h3>
                  <p className="text-[#6B5F9E] text-[11px] mt-0.5">Eliminate silence between tracks</p>
                </div>
                <button
                  onClick={() => setGapless(p => !p)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${gapless ? 'bg-[#8B5CF6]' : 'bg-[#291B4C]'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${gapless ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white text-xs font-medium">Crossfade</h3>
                    <p className="text-[#6B5F9E] text-[11px] mt-0.5">Blend between tracks</p>
                  </div>
                  <span className="text-[#A78BFA] text-xs font-mono">{crossfade}s</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#4B3F7A] text-[11px]">0s</span>
                  <div className="flex-1 relative h-1 bg-[#291B4C] rounded-full cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      setCrossfade(Math.round(pct * 12));
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-[#8B5CF6] rounded-full"
                      style={{ width: `${(crossfade / 12) * 100}%` }}
                    />
                  </div>
                  <span className="text-[#4B3F7A] text-[11px]">12s</span>
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard shortcuts */}
          <section>
            <h2 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-[#8B5CF6]" />
              Keyboard Shortcuts
            </h2>
            <div className="bg-[#1A1130] rounded-2xl p-4 grid grid-cols-2 gap-2">
              {[
                { key: 'Space', action: 'Play / Pause' },
                { key: '⌥ + →', action: 'Next track' },
                { key: '⌥ + ←', action: 'Previous / Restart' },
                { key: 'M', action: 'Mute toggle' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between bg-[#1D1540]/60 rounded-xl px-3 py-2">
                  <span className="text-[#8B7EB3] text-[11px]">{s.action}</span>
                  <kbd className="text-[10px] font-mono bg-[#291B4C] text-[#A78BFA] px-2 py-0.5 rounded-md border border-white/10 ml-2 shrink-0">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Library */}
          <section>
            <h2 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#8B5CF6]" />
              Library
            </h2>
            <div className="bg-[#1A1130] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-medium">{tracks.length} tracks loaded</p>
                <p className="text-[#6B5F9E] text-[11px] mt-0.5">Files are session-only (re-import on refresh)</p>
              </div>
              {tracks.length > 0 && (
                <button
                  onClick={clearLibrary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF3454]/10 hover:bg-[#FF3454]/20 text-[#FF3454] text-[11px] font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* About */}
          <section>
            <div className="bg-[#1A1130] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/40">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white text-xs font-medium">Sonance</p>
                <p className="text-[#6B5F9E] text-[11px]">Offline music player · v1.0</p>
                <p className="text-[#4B3F7A] text-[10px] mt-0.5">Web Audio API · ID3 tags · 5-band EQ</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <PlayerBar />
    </div>
  );
}
