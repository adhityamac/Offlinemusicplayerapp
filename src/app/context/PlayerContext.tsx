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
  lyrics?: string;
  filePath?: string;
};
export type RepeatMode = 'none' | 'one' | 'all';
export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
};

declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<any[] | null>;
      getLibrary: () => Promise<any[]>;
      setMiniPlayer: (isMini: boolean) => void;
      parseFiles: (filePaths: string[]) => Promise<any[]>;
      updateMetadata: (filePath: string, tags: any) => Promise<any>;
    };
  }
}

interface PlayerContextType {
  tracks: Track[];
  loadFiles: () => Promise<void>;
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
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;

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
  favorites: string[];
  toggleFavorite: (id: string) => void;
  addFiles: (filePaths: string[]) => Promise<void>;
  updateTrackMetadata: (filePath: string, tags: any) => Promise<void>;
  
  playlists: Playlist[];
  createPlaylist: (name: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
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
      const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format || 'image/jpeg' });
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
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sonance_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const stored = localStorage.getItem('sonance_playlists');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

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
  const eqEnabledRef = useRef(false);
  const eqBandsRef = useRef([0, 0, 0, 0, 0]);
  const scratchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs with state
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { eqEnabledRef.current = eqEnabled; }, [eqEnabled]);
  useEffect(() => { eqBandsRef.current = eqBands; }, [eqBands]);

  // Apply initial volume
  useEffect(() => {
    audio.volume = volume / 100;
  }, []);

  // Save favorites to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('sonance_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('sonance_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Load persistent library from Electron on startup
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getLibrary().then(lib => {
        if (lib && lib.length > 0) {
          setTracks(lib.map(t => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            cover: t.coverArt || '',
            duration: t.duration,
            src: t.fileUrl,
            lyrics: t.lyrics,
          })));
        }
      });
    }
  }, []);

  // Set up Media Session API for SMTC / Native Media Keys
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => audio.play().catch(console.error));
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (audio.currentTime > 3) audio.currentTime = 0;
        else if (queueIndexRef.current > 0) playAtIndex(queueIndexRef.current - 1);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (queueIndexRef.current < queueRef.current.length - 1) playAtIndex(queueIndexRef.current + 1);
        else if (repeatModeRef.current === 'all') playAtIndex(0);
      });
    }
  }, [audio]);

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

    // Update Native Media Controls Metadata
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.cover ? [{ src: track.cover, sizes: '512x512', type: 'image/jpeg' }] : []
      });
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

  const loadFiles = useCallback(async () => {
    if (window.electronAPI) {
      setIsLoading(true);
      const lib = await window.electronAPI.selectFolder();
      if (lib && lib.length > 0) {
        setTracks(lib.map(t => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          cover: t.coverArt || '',
          duration: t.duration,
          src: t.fileUrl,
          lyrics: t.lyrics,
          filePath: t.filePath,
        })));
      }
      setIsLoading(false);
    } else {
      console.warn('Native folder selection requires Electron environment.');
    }
  }, []);

  const addFiles = useCallback(async (filePaths: string[]) => {
    if (window.electronAPI?.parseFiles) {
      setIsLoading(true);
      const newTracksRaw = await window.electronAPI.parseFiles(filePaths);
      if (newTracksRaw && newTracksRaw.length > 0) {
        const newTracks = newTracksRaw.map(t => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          cover: t.coverArt || '',
          duration: t.duration,
          src: t.fileUrl,
          lyrics: t.lyrics,
          filePath: t.filePath,
        }));
        setTracks(prev => [...newTracks, ...prev.filter(pt => !newTracks.find(nt => nt.id === pt.id))]);
      }
      setIsLoading(false);
    }
  }, []);

  const updateTrackMetadata = useCallback(async (filePath: string, tags: any) => {
    if (window.electronAPI?.updateMetadata) {
      const result = await window.electronAPI.updateMetadata(filePath, tags);
      if (result.success && result.track) {
        setTracks(prev => prev.map(t => {
          if (t.filePath === filePath) {
            return {
              ...t,
              title: result.track.title,
              artist: result.track.artist,
              album: result.track.album,
              cover: result.track.coverArt || '',
            };
          }
          return t;
        }));
        if (currentTrackRef.current?.filePath === filePath) {
          setCurrentTrack(prev => prev ? {
            ...prev,
            title: result.track.title,
            artist: result.track.artist,
            album: result.track.album,
            cover: result.track.coverArt || '',
          } : null);
        }
      }
    }
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
    if (scratchIntervalRef.current) {
      clearInterval(scratchIntervalRef.current);
      scratchIntervalRef.current = null;
    }
    
    if (audio.paused) {
      if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      audio.playbackRate = playbackRate;
      audio.play().catch(console.error);
    } else {
      let currentRate = playbackRate;
      const step = currentRate / 15;
      scratchIntervalRef.current = setInterval(() => {
        currentRate -= step;
        if (currentRate <= 0.1) {
          if (scratchIntervalRef.current) clearInterval(scratchIntervalRef.current);
          audio.pause();
          audio.playbackRate = playbackRate;
        } else {
          audio.playbackRate = currentRate;
        }
      }, 30);
    }
  }, [audio, currentTrack, playbackRate]);

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
    setIsShuffled(prev => {
      const next = !prev;
      if (next && queueRef.current.length > 0 && currentTrackRef.current) {
        // shuffle the remaining queue starting from current track
        const current = currentTrackRef.current;
        const others = tracks.filter(t => t.id !== current.id);
        const shuffled = [...others].sort(() => Math.random() - 0.5);
        const newQueue = [current, ...shuffled];
        queueRef.current = newQueue;
        setQueue(newQueue);
        queueIndexRef.current = 0;
        setQueueIndex(0);
      } else if (!next && currentTrackRef.current) {
        // restore original queue
        const current = currentTrackRef.current;
        queueRef.current = tracks;
        setQueue(tracks);
        const newIdx = tracks.findIndex(t => t.id === current.id);
        const resolvedIdx = newIdx >= 0 ? newIdx : 0;
        queueIndexRef.current = resolvedIdx;
        setQueueIndex(resolvedIdx);
      }
      return next;
    });
  }, [tracks]);

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
      eqBandsRef.current = next;
      return next;
    });
    const filter = eqFiltersRef.current[index];
    if (filter) filter.gain.value = eqEnabledRef.current ? gain : 0;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    audio.playbackRate = rate;
    setPlaybackRateState(rate);
  }, [audio]);

  const toggleEq = useCallback(() => {
    setEqEnabled(prev => {
      const next = !prev;
      eqEnabledRef.current = next;
      eqFiltersRef.current.forEach((filter, i) => {
        filter.gain.value = next ? eqBandsRef.current[i] : 0;
      });
      return next;
    });
  }, []);

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

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const createPlaylist = useCallback((name: string) => {
    setPlaylists(prev => [...prev, { id: 'PL_' + Date.now().toString(), name, trackIds: [] }]);
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.trackIds.includes(trackId)) {
        return { ...p, trackIds: [...p.trackIds, trackId] };
      }
      return p;
    }));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
      }
      return p;
    }));
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
        setQueue,
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
        favorites,
        toggleFavorite,
        addFiles,
        updateTrackMetadata,
        playlists,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
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