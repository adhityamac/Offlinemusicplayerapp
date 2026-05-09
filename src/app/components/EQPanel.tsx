import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { usePlayer } from '../context/PlayerContext';

const BANDS = [
  { label: 'Bass', freq: '60 Hz' },
  { label: 'Low', freq: '250 Hz' },
  { label: 'Mid', freq: '1 kHz' },
  { label: 'High', freq: '4 kHz' },
  { label: 'Air', freq: '16 kHz' },
];

const PRESETS: { name: string; values: number[] }[] = [
  { name: 'Flat', values: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', values: [9, 6, 0, -1, -1] },
  { name: 'Vocal', values: [-2, -1, 5, 5, 0] },
  { name: 'Electronic', values: [6, 4, 0, 3, 5] },
  { name: 'Acoustic', values: [4, 3, 0, 3, 4] },
  { name: 'Pop', values: [-1, 2, 5, 3, -1] },
];

export function EQPanel() {
  const { eqBands, setEqBand, eqEnabled, toggleEq } = usePlayer();

  const applyPreset = (values: number[]) => {
    values.forEach((v, i) => setEqBand(i, v));
  };

  return (
    <div className="bg-[#1A1130] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white text-sm font-medium">Equalizer</h3>
          <p className="text-[#8B7EB3] text-xs mt-0.5">5-band parametric EQ</p>
        </div>
        <button
          onClick={toggleEq}
          className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
            eqEnabled ? 'bg-[#8B5CF6]' : 'bg-[#291B4C]'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
              eqEnabled ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset.values)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#291B4C] text-[#8B7EB3] hover:bg-[#342360] hover:text-white transition-all"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* EQ Sliders */}
      <div className={`flex gap-4 justify-between transition-opacity ${eqEnabled ? 'opacity-100' : 'opacity-40'}`}>
        {BANDS.map((band, index) => (
          <div key={band.label} className="flex flex-col items-center gap-3 flex-1">
            {/* dB label */}
            <span className="text-[#8B7EB3] text-[10px] font-mono">
              {eqBands[index] > 0 ? '+' : ''}{eqBands[index].toFixed(0)}
            </span>

            {/* Vertical Slider */}
            <div className="flex flex-col items-center h-28">
              <Slider.Root
                orientation="vertical"
                min={-12}
                max={12}
                step={0.5}
                value={[eqBands[index]]}
                onValueChange={([v]) => setEqBand(index, v)}
                disabled={!eqEnabled}
                className="relative flex flex-col items-center w-4 h-28 cursor-pointer touch-none select-none"
              >
                <Slider.Track className="relative bg-[#291B4C] rounded-full w-1 flex-1">
                  {/* Center line */}
                  <div className="absolute left-0 right-0 h-px bg-[#3D2A6B] top-1/2" />
                  <Slider.Range className="absolute bottom-1/2 w-full rounded-full bg-[#8B5CF6]" />
                </Slider.Track>
                <Slider.Thumb className="block w-3.5 h-3.5 rounded-full bg-white shadow-lg focus:outline-none hover:bg-[#E9D5FF] transition-colors" />
              </Slider.Root>
            </div>

            {/* Labels */}
            <div className="text-center">
              <div className="text-white text-[10px] font-medium">{band.label}</div>
              <div className="text-[#8B7EB3] text-[9px]">{band.freq}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
