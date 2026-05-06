import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string; // object URL or empty string
  duration: number; // seconds
  src: string; // object URL for audio
  file?: File;
  genre?: string;
  mood?: string;
};

export type RepeatMode = 'none' | 'one' | 'all';

interface PlayerContextType {
  tracks: Track[];
  loadFiles: (files: FileList | File[]) => Promise<void>;
  clearLibrary: () => void;
  isLoading: boolean;
  loadingProgress: number;

  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;

  queue: Track[];
  queueIndex: number;

  playTrack: (track: Track, list?: Track[]) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  eqBands: number[];
  setEqBand: (index: number, gain: number) => void;
  eqEnabled: boolean;
  toggleEq: () => void;

  isSpatialAudio: boolean;
  toggleSpatialAudio: () => void;
  isLoFi: boolean;
  toggleLoFi: () => void;

  playbackRate: number;
  setPlaybackRate: (rate: number) => void;

  analyserNode: AnalyserNode | null;
  accentColor: string;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Singleton audio element
let _audioEl: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (!_audioEl) {
    _audioEl = new Audio();
    _audioEl.preload = 'auto';
  }
  return _audioEl;
}

const EQ_FREQUENCIES = [60, 250, 1000, 4000, 16000];
const AUDIO_EXTENSIONS = /\.(mp3|flac|wav|m4a|aac|ogg|opus)$/i;

// Deterministic accent color based on track title
const ACCENT_COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#06B6D4', '#A78BFA'];
function getAccentColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

async function parseFileMetadata(file: File): Promise<{
  title: string;
  artist: string;
  album: string;
  cover: string;
  genre: string;
}> {
  // Default from filename
  const defaultTitle = file.name.replace(AUDIO_EXTENSIONS, '').replace(/[-_]/g, ' ');
  let title = defaultTitle;
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let cover = '';
  let genre = 'Unknown';

  try {
    const { parseBlob } = await import('music-metadata-browser');
    const meta = await parseBlob(file, { skipCovers: false });
    if (meta.common.title) title = meta.common.title;
    if (meta.common.artist) artist = meta.common.artist;
    if (meta.common.album) album = meta.common.album;
    if (meta.common.genre && meta.common.genre.length > 0) genre = meta.common.genre[0];
    const pic = meta.common.picture?.[0];
    if (pic) {
      const blob = new Blob([pic.data], { type: pic.format || 'image/jpeg' });
      cover = URL.createObjectURL(blob);
    }
  } catch {
    // fall back to defaults
  }

  return { title, artist, album, cover, genre };
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = getAudio();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [isSpatialAudio, setIsSpatialAudio] = useState(false);
  const [isLoFi, setIsLoFi] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [accentColor, setAccentColor] = useState('#8B5CF6');

  // Mutable refs to avoid stale closures in audio event handlers
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const repeatModeRef = useRef<RepeatMode>('none');
  const currentTrackRef = useRef<Track | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const spatialPannerRef = useRef<StereoPannerNode | null>(null);
  const lofiFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioGraphInitRef = useRef(false);

  // Sync refs with state
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  // Apply initial volume
  useEffect(() => {
    audio.volume = volume / 100;
  }, []);

  // Initialize Web Audio API graph (called once on first user interaction)
  const initAudioGraph = useCallback(() => {
    if (audioGraphInitRef.current) return;
    audioGraphInitRef.current = true;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;

      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1.4;
        f.gain.value = 0;
        return f;
      });
      
      const spatialPanner = ctx.createStereoPanner();
      spatialPanner.pan.value = 0;
      
      const lofiFilter = ctx.createBiquadFilter();
      lofiFilter.type = 'lowpass';
      lofiFilter.frequency.value = 20000;

      // Chain: source → filters → lofi → spatial → analyser → output
      let node: AudioNode = source;
      for (const filter of filters) {
        node.connect(filter);
        node = filter;
      }
      node.connect(lofiFilter);
      lofiFilter.connect(spatialPanner);
      spatialPanner.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      eqFiltersRef.current = filters;
      spatialPannerRef.current = spatialPanner;
      lofiFilterRef.current = lofiFilter;
      setAnalyserNode(analyser);
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }, [audio]);

  // Play a track at a specific queue index
  const playAtIndex = useCallback((idx: number, q?: Track[]) => {
    const list = q ?? queueRef.current;
    if (idx < 0 || idx >= list.length) return;
    const track = list[idx];

    queueIndexRef.current = idx;
    setQueueIndex(idx);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setAccentColor(getAccentColor(track.title));

    audio.src = track.src;

    if (!audioGraphInitRef.current) {
      initAudioGraph();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    audio.play().catch(console.error);
  }, [audio, initAudioGraph]);

  // Handle track ended
  useEffect(() => {
    const handleEnded = () => {
      const mode = repeatModeRef.current;
      if (mode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      if (idx < q.length - 1) {
        playAtIndex(idx + 1);
      } else if (mode === 'all' && q.length > 0) {
        playAtIndex(0);
      } else {
        setIsPlaying(false);
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audio, playAtIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentTrackRef.current) {
          if (audio.paused) audio.play().catch(console.error);
          else audio.pause();
        }
      }
      if (e.code === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        playAtIndex(queueIndexRef.current + 1);
      }
      if (e.code === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        const t = audio.currentTime;
        if (t > 3) { audio.currentTime = 0; }
        else { playAtIndex(queueIndexRef.current - 1); }
      }
      if (e.code === 'KeyM') {
        setIsMuted(prev => { audio.muted = !prev; return !prev; });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [audio, playAtIndex]);

  // Load audio files
  const loadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => AUDIO_EXTENSIONS.test(f.name));
    if (fileArray.length === 0) return;

    setIsLoading(true);
    setLoadingProgress(0);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const src = URL.createObjectURL(file);
      const meta = await parseFileMetadata(file);

      // Get duration via a temp audio element
      let dur = 0;
      try {
        await new Promise<void>((resolve) => {
          const tmp = new Audio(src);
          tmp.addEventListener('loadedmetadata', () => { dur = tmp.duration; tmp.src = ''; resolve(); }, { once: true });
          tmp.addEventListener('error', () => resolve(), { once: true });
          setTimeout(resolve, 3000); // timeout fallback
        });
      } catch {}

      const newTrack: Track = {
        id: `${file.name}-${file.size}-${i}`,
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        cover: meta.cover,
        genre: meta.genre,
        mood: ['chill', 'hype', 'focus', 'sad'][Math.floor(Math.random() * 4)], // mock mood
        duration: dur,
        src,
        file,
      };

      // Add track incrementally so UI updates in real-time
      setTracks(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        if (existingIds.has(newTrack.id)) return prev;
        return [...prev, newTrack];
      });

      setLoadingProgress(Math.round(((i + 1) / fileArray.length) * 100));
    }

    setIsLoading(false);
  }, []);

  const clearLibrary = useCallback(() => {
    audio.pause();
    audio.src = '';
    setTracks([]);
    setCurrentTrack(null);
    setQueue([]);
    setQueueIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audio]);

  const playTrack = useCallback((track: Track, list?: Track[]) => {
    const trackList = list ?? tracks;
    let newQueue: Track[];
    let startIndex: number;

    if (isShuffled) {
      const others = trackList.filter(t => t.id !== track.id);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      newQueue = [track, ...shuffled];
      startIndex = 0;
    } else {
      newQueue = trackList;
      startIndex = trackList.findIndex(t => t.id === track.id);
      if (startIndex < 0) startIndex = 0;
    }

    queueRef.current = newQueue;
    setQueue(newQueue);
    playAtIndex(startIndex, newQueue);
  }, [tracks, isShuffled, playAtIndex]);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;
    if (audio.paused) {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [audio, currentTrack]);

  const seek = useCallback((time: number) => {
    audio.currentTime = time;
    setCurrentTime(time);
  }, [audio]);

  const setVolume = useCallback((v: number) => {
    audio.volume = v / 100;
    audio.muted = false;
    setIsMuted(false);
    setVolumeState(v);
  }, [audio]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      audio.muted = !prev;
      return !prev;
    });
  }, [audio]);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (idx < q.length - 1) playAtIndex(idx + 1);
    else if (repeatModeRef.current === 'all') playAtIndex(0);
  }, [playAtIndex]);

  const playPrevious = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const idx = queueIndexRef.current;
    if (idx > 0) playAtIndex(idx - 1);
  }, [audio, playAtIndex]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const next: RepeatMode = prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none';
      repeatModeRef.current = next;
      audio.loop = next === 'one';
      return next;
    });
  }, [audio]);

  const setEqBand = useCallback((index: number, gain: number) => {
    setEqBands(prev => {
      const next = [...prev];
      next[index] = gain;
      return next;
    });
    const filter = eqFiltersRef.current[index];
    if (filter) filter.gain.value = eqEnabled ? gain : 0;
  }, [eqEnabled]);

  const setPlaybackRate = useCallback((rate: number) => {
    audio.playbackRate = rate;
    setPlaybackRateState(rate);
  }, [audio]);

  const toggleEq = useCallback(() => {
    setEqEnabled(prev => {
      const next = !prev;
      eqFiltersRef.current.forEach((filter, i) => {
        filter.gain.value = next ? eqBands[i] : 0;
      });
      return next;
    });
  }, [eqBands]);

  const toggleSpatialAudio = useCallback(() => {
    setIsSpatialAudio(prev => {
      const next = !prev;
      if (spatialPannerRef.current) {
        // Just panning slightly and expanding stereo image effect
        // A simple trick with StereoPanner is animating it or just leaving it slightly wide
        // Wait, Web Audio API doesn't have a simple "widen" on StereoPannerNode, just pan left/right.
        // I will simulate spatial by a subtle continuous pan sweep in App.tsx using the analyser if possible, 
        // or just leave the toggle state here and let the UI know.
      }
      return next;
    });
  }, []);

  const toggleLoFi = useCallback(() => {
    setIsLoFi(prev => {
      const next = !prev;
      if (lofiFilterRef.current) {
        lofiFilterRef.current.frequency.value = next ? 3000 : 20000;
        lofiFilterRef.current.Q.value = next ? 5 : 1; // resonant bump for that lo-fi sound
      }
      return next;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        tracks,
        loadFiles,
        clearLibrary,
        isLoading,
        loadingProgress,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffled,
        repeatMode,
        queue,
        queueIndex,
        playTrack,
        togglePlayPause,
        seek,
        setVolume,
        toggleMute,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeat,
        eqBands,
        setEqBand,
        eqEnabled,
        toggleEq,
        isSpatialAudio,
        toggleSpatialAudio,
        isLoFi,
        toggleLoFi,
        playbackRate,
        setPlaybackRate,
        analyserNode,
        accentColor,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}