import React, { useState, useEffect, useRef } from 'react';
import { PlayerProvider, usePlayer, Track } from './context/PlayerContext';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume1, Volume2, VolumeX, ListMusic, Plus, Settings, 
  Mic2, Music, Compass, Search, Heart, Maximize2, MoreHorizontal,
  Clock, Activity, ChevronUp, ChevronDown, Moon, Gauge, Mic
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const EQ_LABELS = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'];

// Extract vibrant background color
function getAverageColor(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if(!ctx) return resolve('#fa243c');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0,0,img.width,img.height).data;
      let r=0,g=0,b=0;
      const step = Math.ceil(data.length / 4000) * 4;
      let count = 0;
      for(let i=0; i<data.length; i+=step) {
         // boost saturation slightly for better background vibe
         r += Math.min(255, data[i] * 1.1);
         g += Math.min(255, data[i+1] * 1.1);
         b += Math.min(255, data[i+2] * 1.1);
         count++;
      }
      resolve(`rgb(${Math.floor(r/count)},${Math.floor(g/count)},${Math.floor(b/count)})`);
    };
    img.onerror = () => resolve('#fa243c');
    img.src = imgUrl;
  });
}

function Visualizer({ color }: { color: string }) {
  const { analyserNode, isPlaying } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      if (!isPlaying) return;

      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 32) - 2;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        const dataIndex = Math.floor(i * (dataArray.length / 64));
        const value = dataArray[dataIndex];
        const percent = value / 255;
        const barHeight = Math.max(4, percent * canvas.height);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4 + (percent * 0.6);
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyserNode, isPlaying, color]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-20 z-0">
      <canvas ref={canvasRef} className="w-full h-full" width={400} height={64} />
    </div>
  );
}

function useBeatPulse() {
  const { analyserNode, isPlaying } = usePlayer();
  const [pulse, setPulse] = useState(1);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!analyserNode || !isPlaying) {
      setPulse(1);
      return;
    }
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    const update = () => {
      analyserNode.getByteFrequencyData(data);
      // Average the lowest frequencies (kick drum area)
      let sum = 0;
      for (let i = 0; i < 5; i++) sum += data[i];
      const avg = sum / 5;
      // Map 0-255 to 1.0 - 1.3 scale
      const scale = 1 + (avg / 255) * 0.3;
      setPulse(scale);
      animationRef.current = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animationRef.current);
  }, [analyserNode, isPlaying]);

  return pulse;
}

function WaveformScrubber({ duration, currentTime, onSeek, color }: { duration: number, currentTime: number, onSeek: (v: number) => void, color: string }) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="relative w-full h-4 flex items-center cursor-pointer group" onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      onSeek(pct * duration);
    }}>
      <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden transition-all group-hover:h-2">
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%`, backgroundColor: '#fff' }} />
      </div>
      <div 
        className="absolute w-3 h-3 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] scale-0 group-hover:scale-100 transition-transform duration-200 pointer-events-none" 
        style={{ left: `calc(${progress}% - 6px)` }} 
      />
    </div>
  );
}

function QueuePanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { queue, queueIndex, playTrack } = usePlayer();
  const upNext = queue.slice(queueIndex + 1, queueIndex + 21);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-4 bottom-24 right-4 w-96 glass-panel rounded-[2rem] z-50 flex flex-col overflow-hidden"
        >
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <h3 className="text-xl font-bold text-white tracking-tight">Up Next</h3>
            <button onClick={onClose} className="btn-glass w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
            {upNext.length === 0 && <p className="text-center text-muted-foreground mt-10">Queue is empty</p>}
            {upNext.map((track, i) => (
              <motion.div 
                layout
                key={`${track.id}-${i}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <img src={track.cover || 'fallback.png'} className="w-12 h-12 rounded-md object-cover shadow-sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{track.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlayerView({ dominantColor, onQueueToggle, isFocusMode, setIsFocusMode }: { dominantColor: string, onQueueToggle: () => void, isFocusMode: boolean, setIsFocusMode: (v: boolean) => void }) {
  const { 
    currentTrack, isPlaying, togglePlayPause, seek, currentTime, duration,
    volume, setVolume, playNext, playPrevious, toggleShuffle, isShuffled,
    cycleRepeat, repeatMode, eqBands, setEqBand, eqEnabled, toggleEq,
    playbackRate, setPlaybackRate, isSpatialAudio, toggleSpatialAudio, isLoFi, toggleLoFi
  } = usePlayer();

  const [showEq, setShowEq] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 80) playPrevious();
    if (info.offset.x < -80) playNext();
  };

  const handleDoubleTap = () => {
    setIsFocusMode(!isFocusMode);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <aside className={cn("flex flex-col shrink-0 relative z-20 px-6 py-8 glass-panel rounded-3xl transition-all duration-700", isFocusMode ? "w-full h-full p-12 lg:p-20 justify-center items-center rounded-none bg-black/40" : "w-80 xl:w-96")}>
      {/* Album Art Hero */}
      <motion.div 
        drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd}
        className={cn("relative aspect-square touch-none cursor-grab active:cursor-grabbing group", isFocusMode ? "w-[50vh] max-w-2xl mb-12" : "w-full mb-8")}
        onDoubleClick={handleDoubleTap}
      >
        <AnimatePresence>
          {isLiked && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative">
          <img src={currentTrack.cover || 'fallback.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] rounded-2xl pointer-events-none" />
        </div>
      </motion.div>

      {/* Track Info */}
      <div className="mb-6 flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate tracking-tight">{currentTrack.title}</h3>
          <p className="text-lg text-white/60 truncate mt-0.5">{currentTrack.artist}</p>
        </div>
        <button onClick={() => setIsLiked(!isLiked)} className="btn-glass w-10 h-10 rounded-full shrink-0">
          <Heart className={cn("w-6 h-6", isLiked ? "fill-primary text-primary" : "text-white/60")} />
        </button>
      </div>

      {/* Scrubber */}
      <div className="mb-8">
        <WaveformScrubber duration={duration} currentTime={currentTime} onSeek={seek} color={dominantColor} />
        <div className="flex justify-between mt-2 text-[11px] font-medium text-white/50 tracking-wide">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button onClick={toggleShuffle} className={cn("btn-glass w-12 h-12 rounded-full", isShuffled ? "text-primary bg-primary/10" : "")}>
          <Shuffle className="w-5 h-5" />
        </button>
        <button onClick={playPrevious} className="btn-glass w-14 h-14 rounded-full hover:bg-white/10 text-white">
          <SkipBack className="w-8 h-8 fill-current" />
        </button>
        <button onClick={togglePlayPause} className="btn-glass w-20 h-20 rounded-full bg-white hover:bg-white/90 text-black shadow-lg hover:scale-105">
          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
        <button onClick={playNext} className="btn-glass w-14 h-14 rounded-full hover:bg-white/10 text-white">
          <SkipForward className="w-8 h-8 fill-current" />
        </button>
        <button onClick={cycleRepeat} className={cn("btn-glass w-12 h-12 rounded-full", repeatMode !== 'none' ? "text-primary bg-primary/10" : "")}>
          {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
        </button>
      </div>

      {/* Bottom Actions (Volume, EQ, Queue) */}
      <div className="mt-auto flex flex-col gap-6">
        <div className="flex items-center gap-3 group bg-white/5 p-3 rounded-2xl glass-card">
          <Volume1 className="w-4 h-4 text-white/50" />
          <input 
            type="range" min="0" max="100" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
            className="ios-slider flex-1"
          />
          <Volume2 className="w-4 h-4 text-white/50" />
        </div>
        
        <div className="flex items-center justify-between glass-card p-1.5">
          <button onClick={() => setShowEq(!showEq)} className={cn("btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1", showEq ? "bg-white/10 text-white" : "")}>
            EQ
          </button>
          <button onClick={onQueueToggle} className="btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1">
            Up Next
          </button>
          <button onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)} className={cn("btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1", playbackRate !== 1 ? "text-primary" : "")}>
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* EQ Overlay */}
      <AnimatePresence>
        {showEq && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-40 left-6 right-6 glass-panel p-5 rounded-2xl z-50"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-white">Equalizer</span>
              <button onClick={toggleEq} className={cn("w-10 h-6 rounded-full transition-colors flex items-center px-0.5", eqEnabled ? "bg-green-500" : "bg-white/20")}>
                 <div className={cn("w-5 h-5 rounded-full bg-white transition-transform shadow-sm", eqEnabled ? "translate-x-4" : "translate-x-0")} />
              </button>
            </div>
            <div className="flex justify-between gap-2 h-32 items-end px-2 border-b border-white/10 pb-4 mb-4">
              {eqBands.map((gain, i) => (
                <div key={i} className="flex flex-col items-center gap-3 w-8">
                  <div className="relative h-full w-2 bg-white/10 rounded-full flex flex-col justify-end overflow-hidden">
                    <div className="w-full bg-white transition-all duration-100 rounded-full" style={{ height: `${(gain + 12) / 24 * 100}%` }} />
                    <input 
                      type="range" min="-12" max="12" step="0.1" value={gain}
                      onChange={e => setEqBand(i, parseFloat(e.target.value))} disabled={!eqEnabled}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed transform -rotate-90 origin-[50%_50%]"
                      style={{ height: '100px', width: '100px', top: '10px', left: '-40px' }} 
                    />
                  </div>
                  <span className="text-[9px] text-white/50">{EQ_LABELS[i]}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <button onClick={toggleSpatialAudio} className={cn("btn-glass flex-1 py-2 text-xs font-medium rounded-lg", isSpatialAudio ? "bg-white/10 text-white" : "")}>
                3D Spatial
              </button>
              <button onClick={toggleLoFi} className={cn("btn-glass flex-1 py-2 text-xs font-medium rounded-lg", isLoFi ? "bg-white/10 text-white" : "")}>
                Lo-Fi Tape
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function StatCard({ title, value }: { title: string, value: string }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
     const rect = e.currentTarget.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     const rx = (y / rect.height - 0.5) * -30;
     const ry = (x / rect.width - 0.5) * 30;
     setRotateX(rx); setRotateY(ry);
  }
  
  return (
    <motion.div 
      onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      animate={{ rotateX, rotateY }} style={{ transformPerspective: 1000 }}
      className="flex-1 glass-card p-6 bg-white/5 relative overflow-hidden group cursor-default"
    >
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] group-hover:duration-[1.5s]" />
      <div className="text-sm font-medium text-white/50 mb-1">{title}</div>
      <div className="text-4xl font-bold text-white relative z-10 drop-shadow-lg">{value}</div>
    </motion.div>
  );
}

function MainView({ activeTab }: { activeTab: string }) {
  const { tracks, playTrack, currentTrack, loadFiles, queue } = usePlayer();
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, track: Track } | null>(null);

  const moods = ['Chill', 'Focus', 'Upbeat', 'Late Night'];
  const filteredTracks = activeMood ? tracks.filter(t => t.mood === activeMood.toLowerCase()) : tracks;

  // Add click away listener for context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (activeTab === 'STATS') {
    return (
      <main className="flex-1 flex flex-col relative overflow-hidden z-10 pt-12 px-10 glass-panel rounded-3xl">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-8">Listening Stats</h1>
        <div className="flex-1 pb-10">
          <div className="glass-card p-8 flex flex-col gap-10">
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">This Week</h3>
              <div className="flex items-end gap-4 h-40">
                {[40, 60, 30, 80, 100, 50, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full bg-white/5 rounded-lg flex items-end overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                        className="w-full bg-primary rounded-lg" 
                      />
                    </div>
                    <span className="text-xs font-medium text-white/50">{'SMTWTFS'[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <StatCard title="Total Hours" value="124.5" />
              <StatCard title="Top Genre" value="Electronic" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden z-10 pt-12 glass-panel rounded-3xl">
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y, left: contextMenu.x }} 
            className="fixed z-50 glass-card p-2 flex flex-col gap-1 min-w-[160px] shadow-2xl border border-white/20 bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
             <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors">Play Next</button>
             <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors">Add to Queue</button>
             <div className="h-px w-full bg-white/10 my-1" />
             <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors">View Artist</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Nav */}
      <header className="px-10 shrink-0 mb-8 z-20 sticky top-0 bg-gradient-to-b from-black/20 to-transparent pb-4 pt-2">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-6">{getGreeting()}</h1>
        
        {/* Mood Tags */}
        <div className="flex gap-3">
          {moods.map(mood => (
            <button 
              key={mood} onClick={() => setActiveMood(activeMood === mood ? null : mood)}
              className={cn("px-5 py-2 rounded-full text-sm font-medium transition-all duration-200", 
                activeMood === mood ? "bg-white text-black shadow-md" : "bg-white/10 text-white hover:bg-white/20")}
            >
              {mood}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-10 pb-10 relative z-10 no-scrollbar">
        {tracks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
             <div className="glass-card p-12 flex flex-col items-center max-w-md w-full">
               <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
                 <Music className="w-10 h-10 text-white/40" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-3">No Music Found</h2>
               <p className="text-white/50 mb-8">
                 Import your MP3s or FLAC files to start building your local library.
               </p>
               <button onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file'; input.multiple = true; input.accept = 'audio/*';
                  input.onchange = e => { const files = (e.target as HTMLInputElement).files; if (files) loadFiles(files); };
                  input.click();
                }} className="btn-primary px-8 py-3 font-semibold text-lg w-full">
                  Import Music
               </button>
             </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Top Picks Row */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Top Picks for You</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar">
                {filteredTracks.slice(0, 10).map((track, i) => (
                  <motion.div 
                    key={track.id}
                    onClick={() => playTrack(track, filteredTracks)}
                    className="snap-start shrink-0 w-[240px] group cursor-pointer glass-card p-4"
                  >
                    <div className="w-full aspect-square rounded-xl bg-white/5 overflow-hidden mb-4 relative shadow-lg">
                      {track.cover ? <img src={track.cover} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full bg-white/5" />}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                           <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-white truncate text-base">{track.title}</div>
                    <div className="text-white/50 text-sm truncate mt-0.5">{track.artist}</div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* List View */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-5">Recently Added</h2>
              <div className="flex flex-col gap-2">
                {filteredTracks.map((track, idx) => (
                  <div 
                    key={track.id} onClick={() => playTrack(track, filteredTracks)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, track }); }}
                    className="flex items-center gap-4 p-3 glass-card cursor-pointer group"
                  >
                    <div className="w-8 text-center text-sm font-medium text-white/30 group-hover:text-white/80">{idx + 1}</div>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0 shadow-sm relative">
                      {track.cover && <img src={track.cover} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{track.title}</div>
                      <div className="text-sm text-white/50 truncate mt-0.5">{track.artist}</div>
                    </div>
                    <div className="text-sm font-medium text-white/30 group-hover:text-white/80 px-4">{formatTime(track.duration)}</div>
                    <button className="btn-glass w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                       <MoreHorizontal className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <Visualizer color="#ffffff" />
    </main>
  );
}

function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const { loadFiles, togglePlayPause } = usePlayer();
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      togglePlayPause();
      setSleepTimer(null);
      return;
    }
    const id = setInterval(() => setSleepTimer(prev => (prev ? prev - 1 : null)), 60000);
    return () => clearInterval(id);
  }, [sleepTimer, togglePlayPause]);

  return (
    <aside className="w-20 lg:w-64 flex flex-col py-8 px-4 lg:px-6 z-20 glass-panel rounded-3xl shrink-0 relative overflow-hidden">
      <div className="flex items-center justify-center lg:justify-start gap-3 mb-10 px-2 cursor-pointer group">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <Music className="w-5 h-5 text-white" />
        </div>
        <span className="hidden lg:block font-bold text-2xl tracking-tight text-white">Music</span>
      </div>

      <div className="hidden lg:block text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-3">Library</div>
      <nav className="flex flex-col gap-1 mb-8">
        {[
          { icon: Compass, label: 'Listen Now' },
          { icon: Search, label: 'Browse' },
          { icon: Mic, label: 'Radio' },
        ].map(item => (
          <button 
            key={item.label} 
            onClick={() => setActiveTab(item.label.toUpperCase())}
            className={cn("flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-300", 
              activeTab === item.label.toUpperCase() ? "glass-card text-primary font-medium shadow-md" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
             <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.label.toUpperCase() ? "text-primary" : "")} />
             <span className="hidden lg:block text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden lg:block text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-3">Playlists</div>
      <nav className="flex flex-col gap-1 flex-1">
        {[
          { icon: Clock, label: 'Recently Added' },
          { icon: Heart, label: 'Favorites' },
          { icon: Activity, label: 'Stats' },
        ].map(item => (
          <button 
            key={item.label} 
            onClick={() => setActiveTab(item.label.toUpperCase())}
            className={cn("flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-300", 
              activeTab === item.label.toUpperCase() ? "glass-card text-white font-medium shadow-md" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
             <item.icon className="w-5 h-5 shrink-0" />
             <span className="hidden lg:block text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <button 
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file'; input.multiple = true; input.accept = 'audio/*';
          input.onchange = e => { const files = (e.target as HTMLInputElement).files; if (files) loadFiles(files); };
          input.click();
        }}
        className="mt-auto w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Plus className="w-5 h-5 shrink-0" />
        <span className="hidden lg:block text-sm font-medium">New Playlist</span>
      </button>

      <button 
        onClick={() => setSleepTimer(sleepTimer ? null : 30)}
        className={cn("mt-2 w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all", sleepTimer ? "bg-primary/20 text-primary" : "text-white/60 hover:bg-white/10 hover:text-white")}
      >
        <Moon className="w-5 h-5 shrink-0" />
        <span className="hidden lg:block text-sm font-medium">
          {sleepTimer ? `Sleep in ${sleepTimer}m` : 'Sleep Timer'}
        </span>
      </button>
    </aside>
  );
}

function AppLayout() {
  const { currentTrack } = usePlayer();
  const [dominantColor, setDominantColor] = useState<string>('#fa243c');
  const [queueOpen, setQueueOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('LISTEN NOW');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const beatPulse = useBeatPulse();

  useEffect(() => {
    if (currentTrack?.cover) {
      getAverageColor(currentTrack.cover).then(setDominantColor);
      // update favicon
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = currentTrack.cover;
    } else {
      setDominantColor('#111111');
    }
  }, [currentTrack]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black p-0 overflow-hidden relative selection:bg-primary/30">
      
      {/* Full-screen dynamic blurred background */}
      <motion.div 
        animate={{ opacity: 0.8 + (beatPulse - 1) }}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000 bg-black"
      >
        {currentTrack?.cover ? (
           <>
             <img src={currentTrack.cover} className="absolute inset-0 w-full h-full object-cover mix-blend-screen scale-110" style={{ opacity: 0.6 * beatPulse, filter: 'blur(100px)' }} />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
             <div className="absolute inset-0 mix-blend-overlay opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
           </>
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a24] to-black">
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/40 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/40 rounded-full blur-[120px]" />
             <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-primary/30 rounded-full blur-[100px]" />
           </div>
        )}
      </motion.div>

      <div className={cn("relative w-full h-full flex z-10 text-white transition-all duration-700", isFocusMode ? "p-0 gap-0" : "gap-4 p-4 lg:gap-6 lg:p-6")}>
        {!isFocusMode && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        {!isFocusMode && <MainView activeTab={activeTab} />}
        <PlayerView dominantColor={dominantColor} onQueueToggle={() => setQueueOpen(!queueOpen)} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
        {!isFocusMode && <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <AppLayout />
    </PlayerProvider>
  );
}
