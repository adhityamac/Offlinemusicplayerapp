import React, { useState, useEffect, useRef } from 'react';
import { PlayerProvider, usePlayer, Track } from './context/PlayerContext';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume1, Volume2, VolumeX, ListMusic, Plus, Settings, 
  Mic2, Music, Compass, Search, Heart, Maximize2, MoreHorizontal,
  Clock, Activity, ChevronUp, ChevronDown, Moon, Gauge, Mic, GripVertical, X
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, Reorder } from 'motion/react';
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


function HapticButton({ children, onClick, className, title }: { children: React.ReactNode, onClick?: () => void, className?: string, title?: string }) {
  const [ripples, setRipples] = useState<{ x: number, y: number, id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
    if (onClick) onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
      title={title}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ top: ripple.y, left: ripple.x, scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => setRipples((r) => r.filter((r) => r.id !== ripple.id))}
            className="absolute w-10 h-10 bg-white/40 rounded-full pointer-events-none"
            style={{ marginTop: -20, marginLeft: -20 }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
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
    let running = true;
    const update = () => {
      if (!running) return;
      analyserNode.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < 5; i++) sum += data[i];
      const avg = sum / 5;
      const scale = 1 + (avg / 255) * 0.3;
      setPulse(scale);
      animationRef.current = requestAnimationFrame(update);
    };
    update();
    return () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, isPlaying]);

  return pulse;
}

function SmoothScrubber({ duration, currentTime, onSeek }: { duration: number, currentTime: number, onSeek: (v: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(currentTime);

  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const progress = duration > 0 ? ((isDragging ? dragValue : currentTime) / duration) * 100 : 0;

  return (
    <div className="relative w-full h-8 flex items-center group cursor-pointer">
      {/* Background Track */}
      <div className="absolute w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
        {/* Filled Track */}
        <div 
          className="h-full bg-white transition-all ease-linear"
          style={{ width: `${progress}%`, transitionDuration: isDragging ? '0ms' : '200ms' }}
        />
      </div>
      
      {/* Invisible Input for Accessibility & Native Drag Handling */}
      <input 
        type="range"
        min={0}
        max={duration || 100}
        value={isDragging ? dragValue : currentTime}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => {
          setIsDragging(false);
          onSeek(dragValue);
        }}
        onChange={(e) => {
          setDragValue(parseFloat(e.target.value));
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {/* Custom Thumb / Knob */}
      <div 
        className={cn(
          "absolute w-4 h-4 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-200",
          isDragging ? "scale-125 opacity-100" : "scale-100 opacity-0 group-hover:opacity-100"
        )}
        style={{ left: `calc(${progress}% - 8px)` }} 
      />
    </div>
  );
}

function QueuePanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { queue, setQueue, queueIndex, playTrack } = usePlayer();
  const upNext = queue.slice(queueIndex + 1, queueIndex + 31);

  const handleReorder = (newOrder: Track[]) => {
    const newQueue = [...queue.slice(0, queueIndex + 1), ...newOrder, ...queue.slice(queueIndex + 1 + newOrder.length)];
    setQueue(newQueue);
  };

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
            <Reorder.Group axis="y" values={upNext} onReorder={handleReorder} className="space-y-2">
              {upNext.map((track, i) => (
                <Reorder.Item 
                  key={track.id}
                  value={track}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors group cursor-grab active:cursor-grabbing bg-white/5 border border-white/5"
                >
                  <img src={track.cover || 'fallback.png'} className="w-12 h-12 rounded-md object-cover shadow-sm pointer-events-none" />
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <div className="text-sm text-white font-medium truncate">{track.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                  </div>
                  <GripVertical className="w-5 h-5 text-white/30 group-hover:text-white/80 transition-colors" />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ParallaxWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({ x: -(y / rect.height) * 20, y: (x / rect.width) * 20 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PlayerView({ dominantColor, onQueueToggle, isFocusMode, setIsFocusMode, isMiniMode, setIsMiniMode }: { dominantColor: string, onQueueToggle: () => void, isFocusMode: boolean, setIsFocusMode: (v: boolean) => void, isMiniMode: boolean, setIsMiniMode: (v: boolean) => void }) {
  const { 
    currentTrack, isPlaying, togglePlayPause, seek, currentTime, duration,
    volume, setVolume, playNext, playPrevious, toggleShuffle, isShuffled,
    cycleRepeat, repeatMode, eqBands, setEqBand, eqEnabled, toggleEq,
    playbackRate, setPlaybackRate, isSpatialAudio, toggleSpatialAudio, isLoFi, toggleLoFi,
    favorites, toggleFavorite, queue, queueIndex
  } = usePlayer();

  const [showEq, setShowEq] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showHeartPulse, setShowHeartPulse] = useState(false);
  const [showQueuePeek, setShowQueuePeek] = useState(false);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 80) playPrevious();
    if (info.offset.x < -80) playNext();
  };

  const handleDoubleTap = () => {
    toggleFavorite(currentTrack!.id);
    setShowHeartPulse(true);
    setTimeout(() => setShowHeartPulse(false), 1000);
  };

  if (!currentTrack) {
    return (
      <aside className={cn("flex flex-col shrink-0 relative z-20 px-6 py-8 glass-panel rounded-3xl transition-all duration-700", isFocusMode ? "w-full h-full p-12 lg:p-20 justify-center items-center rounded-none bg-black/40" : "w-80 xl:w-96")}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50">
          <div className="w-48 h-48 rounded-full border-4 border-white/10 flex items-center justify-center mb-6" style={{ background: 'radial-gradient(circle, #555 0%, #333 40%, #222 80%, #111 100%)' }}>
            <div className="w-12 h-12 rounded-full bg-black/50 border-2 border-white/20" />
          </div>
          <p className="text-white font-medium text-lg">No track playing</p>
          <p className="text-white/50 text-sm mt-2">Select a track or radio station to start playback.</p>
        </div>
      </aside>
    );
  }
  
  const upNextPeek = queue.slice(queueIndex + 1, queueIndex + 4);

  return (
    <aside className={cn("flex flex-col shrink-0 relative z-20 px-6 py-8 glass-panel rounded-3xl transition-all duration-700", isFocusMode ? "w-full h-full p-12 lg:p-20 justify-center items-center rounded-none bg-black/40" : "w-80 xl:w-96")}>
      {/* Album Art Hero */}
      <ParallaxWrapper className={cn("relative aspect-square touch-none cursor-grab active:cursor-grabbing group", isFocusMode ? "w-[50vh] max-w-2xl mb-12" : "w-full mb-8")}>
        <motion.div 
          drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd}
          className="w-full h-full relative"
          onDoubleClick={handleDoubleTap}
        >
          <AnimatePresence>
            {showHeartPulse && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <Heart className="w-24 h-24 text-primary fill-primary drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Square Vinyl Player Base (QQ Music Style) */}
          <div className="w-full h-full rounded-3xl bg-[#d4d6d8] shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(255,255,255,0.5)] relative border border-white/40 flex items-center justify-center overflow-hidden">
             
             {/* Small decorations on the base */}
             <div className="absolute top-5 left-5 w-8 h-8 rounded-full border-[2.5px] border-[#a0a3a6] flex items-center justify-center shadow-inner">
                <span className="text-[14px] text-[#909396] font-extrabold tracking-tighter">Q</span>
             </div>
             
             <div className="absolute bottom-8 left-8 w-4 h-10 bg-[#b8babb] rounded-full shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] border border-[#a0a3a6]" />
             <div className="absolute bottom-8 right-8 w-8 h-5 bg-[#b8babb] rounded-sm shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] border border-[#a0a3a6]" />

             {/* The Vinyl Record */}
             <div 
               className="w-[85%] h-[85%] rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden relative border border-black/20"
               style={{ 
                 background: 'radial-gradient(circle, #ffd700 0%, #ffcc00 40%, #e6b800 80%, #cca300 100%)',
                 animation: 'spin 4s linear infinite',
                 animationPlayState: isPlaying ? 'running' : 'paused'
               }}
             >
               {/* Grooves */}
               <div className="absolute inset-[8%] rounded-full border border-black/10 pointer-events-none" />
               <div className="absolute inset-[15%] rounded-full border border-black/10 pointer-events-none" />
               <div className="absolute inset-[22%] rounded-full border border-black/10 pointer-events-none" />
               <div className="absolute inset-[30%] rounded-full border border-black/10 pointer-events-none" />
               <div className="absolute inset-[38%] rounded-full border border-black/10 pointer-events-none" />

               {/* Center Label with Album Art */}
               <div className="w-[45%] h-[45%] rounded-full bg-[#111] border-[4px] border-black/90 flex items-center justify-center overflow-hidden z-10 relative shadow-inner">
                 <img src={currentTrack.cover || 'fallback.png'} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                 {/* Center hole */}
                 <div className="absolute w-3 h-3 bg-[#d4d6d8] rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)] border border-black/40 z-20" />
               </div>
               
               {/* Lighting reflection on vinyl */}
               <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-black/40 pointer-events-none mix-blend-screen opacity-50" />
             </div>

             {/* Tonearm Base */}
             <div className="absolute top-10 right-10 w-14 h-14 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 shadow-xl border border-white/40 flex items-center justify-center z-30">
                <div className="w-6 h-6 bg-gradient-to-br from-zinc-600 to-zinc-800 rounded-full shadow-inner border border-zinc-900" />
             </div>
             
             {/* Tonearm Arm */}
             <div 
               className="absolute top-[4.5rem] right-[3.8rem] w-3.5 h-[45%] bg-gradient-to-b from-zinc-400 to-zinc-600 rounded-full origin-top transform transition-transform duration-700 ease-in-out shadow-[10px_10px_20px_rgba(0,0,0,0.5)] z-20 pointer-events-none border border-white/20"
               style={{ transform: isPlaying ? 'rotate(25deg)' : 'rotate(5deg)' }}
             >
                {/* Head */}
                <div className="absolute bottom-0 -left-3 w-10 h-16 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-sm shadow-xl border border-zinc-600 flex justify-center">
                   <div className="w-1.5 h-4 bg-zinc-400 mt-2 rounded-full" />
                </div>
             </div>
          </div>
        </motion.div>
      </ParallaxWrapper>

      {/* Track Info */}
      <div className="mb-6 flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate tracking-tight">{currentTrack.title}</h3>
          <p className="text-lg text-white/60 truncate mt-0.5">{currentTrack.artist}</p>
        </div>
        <HapticButton onClick={() => toggleFavorite(currentTrack.id)} className="btn-glass w-10 h-10 rounded-full shrink-0 flex items-center justify-center">
          <Heart className={cn("w-6 h-6", favorites.includes(currentTrack.id) ? "fill-primary text-primary" : "text-white/60")} />
        </HapticButton>
      </div>

      {/* Scrubber (Smooth iOS Style) */}
      <div className="mb-10 mt-6 relative">
        <SmoothScrubber duration={duration} currentTime={currentTime} onSeek={seek} />
        <div className="flex justify-between mt-3 text-[10px] font-medium text-white/50 tracking-wider">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls (Outlined minimal style) */}
      <div className="flex items-center justify-between px-2 mb-10">
        <HapticButton onClick={toggleShuffle} className={cn("btn-glass w-12 h-12 rounded-full flex items-center justify-center transition-colors", isShuffled ? "text-white" : "text-white/40 hover:text-white/80")}>
          <Shuffle className="w-5 h-5" strokeWidth={1.5} />
        </HapticButton>
        
        <HapticButton onClick={playPrevious} className="btn-glass w-14 h-14 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors">
          <SkipBack className="w-6 h-6" strokeWidth={1.5} />
        </HapticButton>
        
        <HapticButton onClick={togglePlayPause} className="btn-glass w-[4.5rem] h-[4.5rem] rounded-full border border-white/40 hover:border-white/80 text-white/90 hover:text-white flex items-center justify-center transition-all hover:scale-105">
          {isPlaying ? <Pause className="w-8 h-8" strokeWidth={1} /> : <Play className="w-8 h-8 ml-1.5" strokeWidth={1} />}
        </HapticButton>
        
        <HapticButton onClick={playNext} className="btn-glass w-14 h-14 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors">
          <SkipForward className="w-6 h-6" strokeWidth={1.5} />
        </HapticButton>
        
        <HapticButton onClick={onQueueToggle} className="btn-glass w-12 h-12 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
          <ListMusic className="w-5 h-5" strokeWidth={1.5} />
        </HapticButton>
      </div>

      {/* Bottom Actions (Volume, EQ, Queue) */}
      <div className="mt-auto flex flex-col gap-6">
        <div className="flex items-center gap-4 group bg-white/5 px-4 py-3.5 rounded-2xl glass-card shadow-sm">
          <Volume1 className="w-5 h-5 text-white/50 shrink-0" />
          <div className="relative flex-1 h-3 bg-black/40 rounded-full overflow-hidden flex items-center cursor-pointer shadow-inner group" 
               onMouseDown={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const updateVol = (e: any) => {
                   const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                   setVolume(pct * 100);
                 };
                 updateVol(e);
                 const onMove = (e: any) => updateVol(e);
                 const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                 window.addEventListener('mousemove', onMove);
                 window.addEventListener('mouseup', onUp);
               }}
          >
            <div className="h-full bg-white shadow-lg pointer-events-none transition-all duration-75 group-hover:bg-primary" style={{ width: `${volume}%` }} />
          </div>
          <Volume2 className="w-5 h-5 text-white/50 shrink-0" />
        </div>
        
        <div className="flex items-center justify-between glass-card p-1.5 flex-wrap gap-1">
          <button onClick={() => setShowEq(!showEq)} className={cn("btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1", showEq ? "bg-white/10 text-white" : "")}>
            EQ
          </button>
          <button onClick={() => setShowLyrics(!showLyrics)} className={cn("btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1", showLyrics ? "bg-white/10 text-white" : "")}>
            Lyrics
          </button>
          <div className="relative flex-1">
            <button 
              onClick={onQueueToggle} 
              onMouseEnter={() => setShowQueuePeek(true)}
              onMouseLeave={() => setShowQueuePeek(false)}
              className="btn-glass px-4 py-2 text-xs font-medium rounded-lg w-full"
            >
              Up Next
            </button>
            <AnimatePresence>
              {showQueuePeek && upNextPeek.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-zinc-900 border border-zinc-800 shadow-2xl p-2 rounded-xl z-50 flex flex-col gap-1 pointer-events-none"
                >
                  <div className="text-[10px] text-white/50 font-semibold px-2 mb-1 uppercase tracking-wider">Coming Up</div>
                  {upNextPeek.map((track, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
                      <img src={track.cover || 'fallback.png'} className="w-6 h-6 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate font-medium">{track.title}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)} className={cn("btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1", playbackRate !== 1 ? "text-primary" : "")}>
            {playbackRate}x
          </button>
          <button onClick={() => setIsMiniMode(!isMiniMode)} className={cn("btn-glass px-4 py-2 text-xs font-medium rounded-lg flex-1", isMiniMode ? "text-primary" : "")} title="Toggle Mini Player">
             Mini
          </button>
        </div>
      </div>

      {/* EQ Overlay */}
      <AnimatePresence>
        {showEq && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-40 left-6 right-6 bg-zinc-900 border border-zinc-800 shadow-2xl p-5 rounded-2xl z-50"
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
              <button 
                onClick={() => setPlaybackRate(playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : playbackRate === 2 ? 0.8 : 1)} 
                className="btn-glass flex-1 py-2 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white"
              >
                {playbackRate}x Speed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics Overlay */}
      <AnimatePresence>
        {showLyrics && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute top-8 left-6 right-6 bottom-40 bg-zinc-900 border border-zinc-800 shadow-2xl p-6 rounded-3xl z-40 overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-900 p-4 -m-6 rounded-t-3xl z-10 shadow-sm border-b border-white/5">
              <span className="text-lg font-bold text-white tracking-tight">Lyrics</span>
              <button onClick={() => setShowLyrics(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white">
                 ✕
              </button>
            </div>
            <div className="mt-8 flex flex-col items-center">
              {currentTrack.lyrics ? (
                 <div className="text-center text-lg lg:text-2xl font-bold leading-loose text-white/40 whitespace-pre-wrap px-4 py-8 drop-shadow-md flex flex-col gap-4">
                   {currentTrack.lyrics.split('\n').map((line, idx, arr) => {
                     // Very naive sync highlighting: active line based on current time
                     const pct = currentTime / duration;
                     const linePct = idx / arr.length;
                     const nextLinePct = (idx + 1) / arr.length;
                     const isActive = pct >= linePct && pct < nextLinePct;
                     
                     return (
                       <span key={idx} className={cn("transition-colors duration-300", isActive ? "text-white scale-105" : "")}>
                         {line}
                       </span>
                     );
                   })}
                 </div>
              ) : (
                 <div className="flex items-center justify-center h-full min-h-[200px] text-white/50 font-medium">
                   No lyrics found for this track.
                 </div>
              )}
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

function ID3EditorModal({ track, onClose }: { track: Track, onClose: () => void }) {
  const { updateTrackMetadata } = usePlayer();
  const [formData, setFormData] = useState({
    title: track.title || '',
    artist: track.artist || '',
    album: track.album || '',
    genre: track.genre || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (track.filePath) {
      setIsSaving(true);
      await updateTrackMetadata(track.filePath, formData);
      setIsSaving(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative glass-card bg-black/80 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit Metadata</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1">Title</label>
            <input 
              type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1">Artist</label>
            <input 
              type="text" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1">Album</label>
            <input 
              type="text" value={formData.album} onChange={e => setFormData({...formData, album: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1">Genre</label>
            <input 
              type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary/80 transition-colors disabled:opacity-50 flex justify-center items-center">
              {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CreatePlaylistModal({ onClose }: { onClose: () => void }) {
  const { createPlaylist } = usePlayer();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createPlaylist(name.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative glass-card bg-black/80 w-full max-w-sm p-8 rounded-3xl shadow-2xl border border-white/10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">New Playlist</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Playlist Name"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="pt-2 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary/80 transition-colors disabled:opacity-50">
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


function MainView({ activeTab, setIsMiniMode }: { activeTab: string, setIsMiniMode?: (val: boolean) => void }) {
  const { tracks, playTrack, loadFiles, favorites, toggleFavorite } = usePlayer();
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, track: Track } | null>(null);
  const [metadataTrack, setMetadataTrack] = useState<Track | null>(null);

  const moods = ['Chill', 'Focus', 'Upbeat', 'Late Night'];
  
  const isTrackMood = (track: Track, mood: string) => {
    const m = mood.toLowerCase();
    if (track.mood && track.mood.toLowerCase() === m) return true;
    
    const combined = `${track.genre || ''} ${track.title} ${track.artist}`.toLowerCase();
    
    // Heuristics
    if (m === 'chill' && /chill|lofi|ambient|acoustic|slow|jazz/i.test(combined)) return true;
    if (m === 'focus' && /focus|study|classical|instrumental|piano|synth/i.test(combined)) return true;
    if (m === 'upbeat' && /upbeat|dance|pop|electro|house|party|rock|fast/i.test(combined)) return true;
    if (m === 'late night' && /late night|dark|wave|r&b|soul|synthwave/i.test(combined)) return true;

    // Fallback: deterministic pseudo-random assignment to ensure categories aren't empty
    const hash = track.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const assignedIndex = hash % moods.length;
    return moods[assignedIndex].toLowerCase() === m;
  };

  const filteredTracks = activeMood ? tracks.filter(t => isTrackMood(t, activeMood)) : tracks;
  const recentTracks = [...tracks].reverse();
  const favoriteTracks = tracks.filter(t => favorites.includes(t.id));

  // Search Results
  const searchResults = searchQuery.trim() === '' ? [] : tracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderTrackList = (list: Track[], title: string, emptyMessage: string) => (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      {list.length === 0 ? (
        <div className="text-white/50 text-center py-10 font-medium">{emptyMessage}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((track, idx) => (
            <div 
              key={track.id + idx} 
              onClick={() => { playTrack(track, list); setIsMiniMode?.(true); }}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, track }); }}
              className="flex items-center gap-4 p-3 glass-card cursor-pointer group hover:bg-white/10 transition-colors"
            >
              <div className="w-8 text-center text-sm font-medium text-white/30 group-hover:text-white/80">{idx + 1}</div>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0 shadow-sm relative">
                {track.cover && <img src={track.cover} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{track.title}</div>
                <div className="text-sm text-white/50 truncate mt-0.5">{track.artist}</div>
              </div>
              <div className="text-sm font-medium text-white/30 group-hover:text-white/80 px-4">{formatTime(track.duration)}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                className="btn-glass w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mr-2"
              >
                 <Heart className={cn("w-4 h-4", favorites.includes(track.id) ? "fill-primary text-primary" : "text-white/60")} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderContent = () => {
    if (tracks.length === 0 && activeTab !== 'RADIO' && activeTab !== 'STATS') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center">
           <div className="glass-card p-12 flex flex-col items-center max-w-md w-full shadow-2xl">
             <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
               <Music className="w-10 h-10 text-white/40" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-3">No Music Found</h2>
             <p className="text-white/50 mb-8">Import your MP3s or FLAC files to start building your local library.</p>
             <button onClick={() => loadFiles()} className="btn-primary px-8 py-3 font-semibold text-lg w-full">
                Import Music
             </button>
           </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'LISTEN NOW':
        return (
          <div className="space-y-12 pb-10">
            <header className="mb-8 z-20 sticky top-0 bg-gradient-to-b from-black/60 to-transparent pb-4 pt-2 backdrop-blur-sm -mx-10 px-10">
              <h1 className="text-4xl font-bold text-white tracking-tight mb-6">{getGreeting()}</h1>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {moods.map(mood => (
                  <button 
                    key={mood} onClick={() => setActiveMood(activeMood === mood ? null : mood)}
                    className={cn("px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 shrink-0", 
                      activeMood === mood ? "bg-white text-black shadow-md" : "bg-white/10 text-white hover:bg-white/20")}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </header>

            {/* Smart Genre Shelf */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Smart Genres</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {['Pop', 'Electronic', 'Rock', 'Jazz', 'Classical', 'Hip-Hop'].map(genre => (
                  <div key={genre} className="flex-1 min-w-[120px] h-24 rounded-2xl glass-card flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-purple-600/40 flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-xs font-medium text-white/80">{genre}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3D Album Carousel style Top Picks */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Top Picks for You</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-8 -mx-10 px-10 snap-x no-scrollbar">
                {filteredTracks.slice(0, 10).map((track, i) => (
                  <motion.div 
                    key={track.id}
                    onClick={() => playTrack(track, filteredTracks)}
                    className="snap-center shrink-0 w-[240px] group cursor-pointer"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-white/5 overflow-hidden mb-4 relative shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105 border border-white/5">
                      {track.cover ? <img src={track.cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="w-full h-full bg-white/5" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                         <Play className="w-5 h-5 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <div className="font-bold text-white truncate text-lg tracking-tight">{track.title}</div>
                    <div className="text-white/50 text-sm truncate mt-0.5 font-medium">{track.artist}</div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        );

      case 'BROWSE':
        return (
          <div className="space-y-8 pb-10">
            <header className="mb-6 z-20 sticky top-0 bg-black/60 pb-4 pt-8 backdrop-blur-md -mx-10 px-10">
              <h1 className="text-4xl font-bold text-white tracking-tight mb-6">Browse</h1>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Search songs, artists, or albums..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 outline-none focus:bg-white/15 focus:border-white/30 transition-all font-medium text-lg shadow-inner"
                />
              </div>
            </header>

            {searchQuery.trim() === '' ? (
              <section>
                <h2 className="text-xl font-semibold text-white mb-5">Recent Searches</h2>
                <div className="flex flex-wrap gap-3">
                  {['Blinding Lights', 'The Weeknd', 'Synthwave', 'Daft Punk', 'Chill vibes'].map(s => (
                    <button key={s} onClick={() => setSearchQuery(s)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              renderTrackList(searchResults, `Search Results for "${searchQuery}"`, 'No results found.')
            )}
          </div>
        );



      case 'RECENTLY ADDED':
        return (
          <div className="pt-8 pb-10 space-y-6">
            {renderTrackList(recentTracks, 'Recently Added', 'Your library is empty.')}
          </div>
        );

      case 'FAVORITES':
        return (
          <div className="pt-8 pb-10 space-y-6">
            {renderTrackList(favoriteTracks, 'Favorites', 'You have no favorite tracks yet. Double-tap a track to heart it!')}
          </div>
        );

      case 'STATS':
        return (
          <div className="pt-8 pb-10 space-y-8">
            <h1 className="text-4xl font-bold text-white tracking-tight">Listening Stats</h1>
            <div className="glass-card p-8 flex flex-col gap-10 rounded-3xl shadow-xl">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6">This Week</h3>
                <div className="flex items-end gap-4 h-40">
                  {[40, 60, 30, 80, 100, 50, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                      <div className="w-full bg-white/5 rounded-lg flex items-end overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                          className="w-full bg-primary rounded-lg shadow-[0_0_15px_rgba(250,36,60,0.5)]" 
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
        );
        
      default:
        if (activeTab.startsWith('PL_')) {
          const playlistId = activeTab;
          const playlist = playlists.find(p => p.id === playlistId);
          if (!playlist) return null;
          const playlistTracks = tracks.filter(t => playlist.trackIds.includes(t.id));
          return (
            <div className="pt-8 pb-10 space-y-6">
              {renderTrackList(playlistTracks, playlist.name, 'This playlist is empty. Add some tracks!')}
            </div>
          );
        }
        return null;
    }
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden z-10 glass-panel rounded-3xl">
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y, left: contextMenu.x }} 
            className="fixed z-50 glass-card p-2 flex flex-col gap-1 min-w-[160px] shadow-2xl border border-white/20 bg-black/60 backdrop-blur-xl rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
             <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors">Play Next</button>
             <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors">Add to Queue</button>
            <div className="h-px w-full bg-white/10 my-1" />
             {playlists.length > 0 && (
               <div className="relative group/sub">
                 <button className="w-full px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors flex justify-between items-center">
                   Add to Playlist <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
                 </button>
                 <div className="absolute top-0 left-full ml-1 hidden group-hover/sub:flex flex-col gap-1 min-w-[160px] glass-card p-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl">
                   {playlists.map(p => (
                     <button key={p.id} onClick={() => { addTrackToPlaylist(p.id, contextMenu.track.id); setContextMenu(null); }} className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white transition-colors truncate">
                       {p.name}
                     </button>
                   ))}
                 </div>
               </div>
             )}
             <button className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors">View Artist</button>
             <button 
               onClick={() => { setMetadataTrack(contextMenu.track); setContextMenu(null); }}
               className="px-4 py-2 hover:bg-white/10 rounded-lg text-left text-sm text-white font-medium transition-colors"
             >
               Edit Metadata
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {metadataTrack && (
          <ID3EditorModal track={metadataTrack} onClose={() => setMetadataTrack(null)} />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-10 relative z-10 no-scrollbar">
        {renderContent()}
      </div>


    </main>
  );
}

function Sidebar({ activeTab, setActiveTab, setIsMiniMode, onNewPlaylist }: { activeTab: string, setActiveTab: (t: string) => void, setIsMiniMode?: (val: boolean) => void, onNewPlaylist: () => void }) {
  const { loadFiles, togglePlayPause, isPlaying, currentTrack, playlists } = usePlayer();
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
        {playlists.map(p => (
          <button 
            key={p.id} 
            onClick={() => setActiveTab(p.id)}
            className={cn("flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-300", 
              activeTab === p.id ? "glass-card text-white font-medium shadow-md" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
             <ListMusic className="w-5 h-5 shrink-0" />
             <span className="hidden lg:block text-sm truncate">{p.name}</span>
          </button>
        ))}
      </nav>



      <button 
        onClick={onNewPlaylist}
        className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
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
  const { currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const [dominantColor, setDominantColor] = useState<string>('#fa243c');
  const [queueOpen, setQueueOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('LISTEN NOW');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const { addFiles } = usePlayer();
  const beatPulse = useBeatPulse();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setMiniPlayer(isMiniMode);
    }
  }, [isMiniMode]);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).map(f => (f as any).path).filter(Boolean);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  return (
    <div 
      className="flex h-screen w-full items-center justify-center bg-black p-0 overflow-hidden relative selection:bg-primary/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/80 text-white px-8 py-6 rounded-2xl flex flex-col items-center shadow-2xl">
              <Plus className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-3xl font-bold">Drop audio files to import</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen dynamic blurred background */}
      <motion.div 
        animate={{ opacity: 0.8 + (beatPulse - 1) }}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000 bg-black"
      >
        {currentTrack?.cover ? (
           <>
             <div className="absolute inset-0 bg-black/40" />
             <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-screen mesh-blob-1" style={{ backgroundColor: dominantColor, opacity: 0.4 * beatPulse, filter: 'blur(120px)' }} />
             <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen mesh-blob-2" style={{ backgroundColor: dominantColor, opacity: 0.3 * beatPulse, filter: 'blur(150px)' }} />
             <div className="absolute top-[20%] left-[30%] w-[50%] h-[50%] bg-white rounded-full mix-blend-overlay mesh-blob-1" style={{ opacity: 0.15, filter: 'blur(100px)', animationDelay: '-5s' }} />
             <img src={currentTrack.cover} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-10 blur-[80px]" />
             <div className="absolute inset-0 mix-blend-overlay opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
           </>
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a24] to-black">
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/40 rounded-full blur-[120px] mesh-blob-1" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/40 rounded-full blur-[120px] mesh-blob-2" />
             <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-primary/30 rounded-full blur-[100px] mesh-blob-1" style={{ animationDelay: '-5s' }} />
           </div>
        )}
      </motion.div>

      <div className={cn("relative w-full h-full flex z-10 text-white transition-all duration-700", isFocusMode ? "p-0 gap-0" : isMiniMode ? "p-0 bg-black/60 backdrop-blur-xl" : "gap-4 p-4 lg:gap-6 lg:p-6")}>
        {!isFocusMode && !isMiniMode && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNewPlaylist={() => setShowCreatePlaylist(true)} />}
        {!isFocusMode && !isMiniMode && <MainView activeTab={activeTab} />}
        
        {isMiniMode ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#e0e0e0] overflow-hidden relative -webkit-app-region-drag border border-white/20">
             
             {/* The Square Record Player UI */}
             <button onClick={() => setIsMiniMode(false)} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/10 text-black/60 flex items-center justify-center hover:bg-black/20 hover:text-black transition-colors -webkit-app-region-no-drag z-50" title="Expand">
               <Maximize2 className="w-4 h-4" />
             </button>

             <div className="flex-1 flex items-center justify-center relative w-full mt-4">
                {/* The spinning record */}
                <div 
                  className="absolute w-[280px] h-[280px] rounded-full shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-1000"
                  style={{ 
                    background: 'radial-gradient(circle, #ffd700 0%, #ffcc00 40%, #e6b800 80%, #cca300 100%)',
                    animation: 'spin 4s linear infinite',
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                >
                  {/* Grooves */}
                  <div className="absolute inset-4 rounded-full border border-black/10 pointer-events-none" />
                  <div className="absolute inset-8 rounded-full border border-black/10 pointer-events-none" />
                  <div className="absolute inset-12 rounded-full border border-black/10 pointer-events-none" />
                  <div className="absolute inset-16 rounded-full border border-black/10 pointer-events-none" />
                  <div className="absolute inset-20 rounded-full border border-black/10 pointer-events-none" />
                  <div className="absolute inset-24 rounded-full border border-black/10 pointer-events-none" />
                  
                  {/* Center Label */}
                  <div className="w-20 h-20 rounded-full bg-[#111] border border-black/40 flex items-center justify-center overflow-hidden z-10 shadow-inner">
                    <img src={currentTrack?.cover || 'fallback.png'} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute w-3 h-3 bg-[#e0e0e0] rounded-full z-20 shadow-sm border border-black/40" />
                  </div>
                </div>

                {/* Tonearm Base */}
                <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-lg z-30 border border-zinc-600 flex items-center justify-center">
                   <div className="w-4 h-4 bg-zinc-900 rounded-full shadow-inner" />
                </div>
                
                {/* Tonearm Arm */}
                <div 
                  className="absolute top-6 right-8 w-2 h-32 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-full origin-top transform transition-transform duration-700 ease-in-out shadow-2xl z-20 pointer-events-none"
                  style={{ transform: isPlaying ? 'rotate(25deg)' : 'rotate(5deg)' }}
                >
                   {/* Head */}
                   <div className="absolute bottom-0 -left-3 w-8 h-10 bg-zinc-800 rounded-sm shadow-xl border border-zinc-700" />
                </div>
             </div>

             {/* Bottom bar inside the player */}
             <div className="w-full h-20 bg-[#d0d0d0]/50 backdrop-blur-md flex items-center px-6 gap-4 border-t border-black/5 -webkit-app-region-no-drag z-40">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-black/90 truncate text-base">{currentTrack?.title || 'No track'}</div>
                  <div className="text-xs font-medium text-black/60 truncate">{currentTrack?.artist || 'Unknown'}</div>
                </div>
                <button onClick={() => togglePlayPause()} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0">
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
             </div>
          </div>
        ) : (
          <PlayerView dominantColor={dominantColor} onQueueToggle={() => setQueueOpen(!queueOpen)} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} isMiniMode={isMiniMode} setIsMiniMode={setIsMiniMode} />
        )}
        
        {!isFocusMode && !isMiniMode && <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />}
        <AnimatePresence>
          {showCreatePlaylist && <CreatePlaylistModal onClose={() => setShowCreatePlaylist(false)} />}
        </AnimatePresence>
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
