import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  DeckViewMode,
  EqualizerPreset,
  Playlist,
  RepeatMode,
  Track,
  VisualizerMode,
} from './types';
import { DEFAULT_PLAYLISTS, DEFAULT_TRACKS } from './data/defaultCatalog';
import { audioEngine } from './services/audioEngine';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TrackList } from './components/TrackList';
import { NowPlayingDeck } from './components/NowPlayingDeck';
import { Visualizer } from './components/Visualizer';
import { PlayerBar } from './components/PlayerBar';
import { EqualizerModal, PRESETS } from './components/EqualizerModal';
import { LyricsDrawer } from './components/LyricsDrawer';
import { QueueDrawer } from './components/QueueDrawer';
import { FocusModeOverlay } from './components/FocusModeOverlay';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { generateId, formatDurationLong } from './utils/formatters';
import { Disc, Play, Shuffle, Music, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './services/auth';
import { driveDatabase, AuraCloudDatabase } from './services/driveDatabase';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ConfirmActionModal } from './components/ConfirmActionModal';

export default function App() {
  // --- Persistent Storage State ---
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_custom_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_TRACKS, ...parsed];
      }
    } catch (e) {
      console.warn('Failed to parse saved custom tracks', e);
    }
    return DEFAULT_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('aura_playlists');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved playlists', e);
    }
    return DEFAULT_PLAYLISTS;
  });

  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('aura_liked_tracks');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to parse liked tracks', e);
    }
    return new Set(['track-1', 'track-2']);
  });

  // --- Playback State ---
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEFAULT_TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [deckMode, setDeckMode] = useState<DeckViewMode>('modern');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  // --- Queue State ---
  const [queue, setQueue] = useState<Track[]>([]);

  // --- Equalizer State ---
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [activePresetName, setActivePresetName] = useState<string>('Flat');
  const [preAmp, setPreAmp] = useState<number>(0);
  const [stereoPan, setStereoPan] = useState<number>(0);

  // --- Navigation & Filter State ---
  const [activeTab, setActiveTab] = useState<string>('tracks');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // --- Modals & Drawers ---
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [isEqOpen, setIsEqOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // --- Sleep Timer State ---
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  // --- Google Drive Cloud Database State ---
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudDb, setCloudDb] = useState<AuraCloudDatabase | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Drag and drop overlay state
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Sync likes to localStorage
  useEffect(() => {
    localStorage.setItem('aura_liked_tracks', JSON.stringify(Array.from(likedTrackIds)));
  }, [likedTrackIds]);

  // Sync playlists to localStorage
  useEffect(() => {
    localStorage.setItem('aura_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Push library database to Google Drive
  const pushSyncToDrive = useCallback(
    async (tokenOverride?: string, emailOverride?: string) => {
      const tokenToUse = tokenOverride || accessToken;
      if (!tokenToUse) return;

      setIsSyncing(true);
      try {
        const customTracksOnly = tracks.filter((t) => t.isCustom);
        const currentDbData: AuraCloudDatabase = {
          version: 1,
          updatedAt: new Date().toISOString(),
          userEmail: emailOverride || user?.email || undefined,
          playlists,
          likedTrackIds: Array.from(likedTrackIds),
          customTracks: customTracksOnly.map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            duration: t.duration,
            coverUrl: t.coverUrl,
            genre: t.genre,
            synthMood: t.synthMood,
            driveFileId: t.driveFileId,
            audioUrl: t.driveFileId ? undefined : t.audioUrl,
          })),
          equalizer: {
            gains: eqGains,
            activePreset: activePresetName,
            preAmp,
            stereoPan,
          },
          settings: {
            deckMode,
            visualizerMode,
            volume,
            lastTrackId: currentTrack?.id,
          },
        };

        await driveDatabase.saveDatabase(tokenToUse, currentDbData);
        setCloudDb(currentDbData);
        setLastSyncedAt(currentDbData.updatedAt);
      } catch (err) {
        console.error('Failed to save database to Drive:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [
      accessToken,
      user?.email,
      tracks,
      playlists,
      likedTrackIds,
      eqGains,
      activePresetName,
      preAmp,
      stereoPan,
      deckMode,
      visualizerMode,
      volume,
      currentTrack?.id,
    ]
  );

  // Load cloud library from Google Drive
  const loadCloudData = useCallback(
    async (token: string, email?: string) => {
      setIsSyncing(true);
      try {
        const cloudRes = await driveDatabase.loadDatabase(token);
        if (cloudRes && cloudRes.data) {
          const db = cloudRes.data;
          setCloudDb(db);
          setLastSyncedAt(db.updatedAt);
          if (db.playlists && db.playlists.length > 0) {
            setPlaylists(db.playlists);
          }
          if (db.likedTrackIds) {
            setLikedTrackIds(new Set(db.likedTrackIds));
          }
          if (db.equalizer) {
            setEqGains(db.equalizer.gains);
            setActivePresetName(db.equalizer.activePreset);
            audioEngine.setAllEqGains(db.equalizer.gains);
            setPreAmp(db.equalizer.preAmp);
            setStereoPan(db.equalizer.stereoPan);
            audioEngine.setStereoPan(db.equalizer.stereoPan);
          }
          if (db.settings?.deckMode) {
            setDeckMode(db.settings.deckMode as DeckViewMode);
          }
          if (db.settings?.visualizerMode) {
            setVisualizerMode(db.settings.visualizerMode as VisualizerMode);
          }
          if (db.customTracks && db.customTracks.length > 0) {
            const restoredTracks: Track[] = await Promise.all(
              db.customTracks.map(async (ct) => {
                let audioUrl = ct.audioUrl || '';
                if (ct.driveFileId) {
                  try {
                    audioUrl = await driveDatabase.fetchAudioBlobUrl(token, ct.driveFileId);
                  } catch (e) {
                    console.warn('Failed to stream audio file from Drive:', ct.driveFileId, e);
                  }
                }
                return {
                  ...ct,
                  audioUrl: audioUrl || ct.audioUrl || '',
                  isCustom: true,
                } as Track;
              })
            );
            setTracks((prev) => {
              const defaultOnly = prev.filter((t) => !t.isCustom);
              return [...defaultOnly, ...restoredTracks];
            });
          }
        } else {
          // Initialize database on Drive
          await pushSyncToDrive(token, email);
        }
      } catch (err) {
        console.error('Failed to load cloud database:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [pushSyncToDrive]
  );

  // Google Drive Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
        setIsAuthLoading(false);
        await loadCloudData(token, authedUser.email || undefined);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
        setCloudDb(null);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [loadCloudData]);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        await loadCloudData(res.accessToken, res.user.email || undefined);
      }
    } catch (err) {
      console.error('Google Sign in failed:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setCloudDb(null);
    setLastSyncedAt(null);
  };

  const handleRequestDeleteCloudData = useCallback(() => {
    if (!accessToken || !cloudDb) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Cloud Database',
      description:
        'Are you sure you want to delete your Aura Sound database from Google Drive? This will delete the synced database file from your Google Drive folder.',
      confirmLabel: 'Delete from Drive',
      isDestructive: true,
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const folderRes = await driveDatabase.loadDatabase(accessToken);
          if (folderRes?.fileId) {
            await driveDatabase.deleteFile(accessToken, folderRes.fileId);
          }
          setCloudDb(null);
          setLastSyncedAt(null);
          setIsSyncModalOpen(false);
        } catch (err) {
          console.error('Failed to delete cloud database:', err);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  }, [accessToken, cloudDb]);

  // --- Audio Engine Listeners Setup ---
  useEffect(() => {
    audioEngine.onTimeUpdate((curr, dur) => {
      setCurrentTime(curr);
      if (dur && !isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
    });

    audioEngine.onEnded(() => {
      handleTrackEnded();
    });

    audioEngine.setVolume(isMuted ? 0 : volume);

    return () => {
      audioEngine.destroy();
    };
  }, []);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerSeconds === null) return;
    if (sleepTimerSeconds <= 0) {
      audioEngine.pause();
      setIsPlaying(false);
      setSleepTimerSeconds(null);
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds]);

  // --- Playback Handlers ---
  const handlePlayTrack = useCallback(
    async (track: Track, startTime = 0) => {
      setCurrentTrack(track);
      setDuration(track.duration);
      setCurrentTime(startTime);
      setIsPlaying(true);
      await audioEngine.playTrack(track.audioUrl, track.duration, track.synthMood, startTime);
    },
    []
  );

  const handlePauseTrack = useCallback(() => {
    setIsPlaying(false);
    audioEngine.pause();
  }, []);

  const handleTogglePlayPause = useCallback(async () => {
    if (isPlaying) {
      handlePauseTrack();
    } else {
      if (currentTrack) {
        setIsPlaying(true);
        await audioEngine.resume();
      } else if (tracks.length > 0) {
        handlePlayTrack(tracks[0]);
      }
    }
  }, [isPlaying, currentTrack, tracks, handlePauseTrack, handlePlayTrack]);

  const handleSeek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  }, []);

  // Compute active track pool based on active navigation tab / playlist
  const activeTrackList = useMemo(() => {
    if (activePlaylistId) {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      if (pl) {
        return tracks.filter((t) => pl.trackIds.includes(t.id));
      }
    }
    if (activeTab === 'favorites') {
      return tracks.filter((t) => likedTrackIds.has(t.id));
    }
    return tracks;
  }, [activePlaylistId, activeTab, playlists, tracks, likedTrackIds]);

  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      handlePlayTrack(nextTrack);
      return;
    }

    if (activeTrackList.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * activeTrackList.length);
      handlePlayTrack(activeTrackList[randomIndex]);
      return;
    }

    const currentIndex = activeTrackList.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % activeTrackList.length;
    handlePlayTrack(activeTrackList[nextIndex]);
  }, [queue, activeTrackList, isShuffle, currentTrack, handlePlayTrack]);

  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }

    if (activeTrackList.length === 0) return;

    const currentIndex = activeTrackList.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + activeTrackList.length) % activeTrackList.length;
    handlePlayTrack(activeTrackList[prevIndex]);
  }, [currentTime, activeTrackList, currentTrack, handleSeek, handlePlayTrack]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      handlePlayTrack(currentTrack, 0);
    } else if (repeatMode === 'all' || queue.length > 0) {
      handleNext();
    } else {
      setIsPlaying(false);
      handleSeek(0);
    }
  }, [repeatMode, currentTrack, queue, handlePlayTrack, handleNext, handleSeek]);

  const handleVolumeChange = useCallback(
    (vol: number) => {
      setVolume(vol);
      if (isMuted && vol > 0) {
        setIsMuted(false);
      }
      audioEngine.setVolume(vol);
    },
    [isMuted]
  );

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setVolume(nextMuted ? 0 : volume);
  }, [isMuted, volume]);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const handleCycleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  }, []);

  const handleCyclePlaybackRate = useCallback(() => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    audioEngine.setPlaybackRate(next);
  }, [playbackRate]);

  const handleCycleVisualizer = useCallback(() => {
    const modes: VisualizerMode[] = ['bars', 'wave', 'radial', 'vu'];
    setVisualizerMode((prev) => modes[(modes.indexOf(prev) + 1) % modes.length]);
  }, []);

  const handleCycleDeckMode = useCallback(() => {
    const modes: DeckViewMode[] = ['modern', 'vinyl', 'cassette'];
    setDeckMode((prev) => modes[(modes.indexOf(prev) + 1) % modes.length]);
  }, []);

  const handleToggleLike = useCallback((trackId: string) => {
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  const handleAddToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const handleRemoveFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const handleSetSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerSeconds(null);
    } else {
      setSleepTimerSeconds(minutes * 60);
    }
  }, []);

  // --- Equalizer Handlers ---
  const handleChangeEqGain = useCallback((bandIdx: number, val: number) => {
    setEqGains((prev) => {
      const next = [...prev] as [number, number, number, number, number];
      next[bandIdx] = val;
      audioEngine.setEqGain(bandIdx, val);
      return next;
    });
    setActivePresetName('Custom');
  }, []);

  const handleApplyPreset = useCallback((preset: EqualizerPreset) => {
    setEqGains(preset.gains);
    setActivePresetName(preset.name);
    audioEngine.setAllEqGains(preset.gains);
  }, []);

  const handleChangePreAmp = useCallback((val: number) => {
    setPreAmp(val);
    const gainFactor = Math.pow(10, val / 20);
    audioEngine.setVolume(volume * gainFactor);
  }, [volume]);

  const handleChangeStereoPan = useCallback((val: number) => {
    setStereoPan(val);
    audioEngine.setStereoPan(val);
  }, []);

  const handleResetEq = useCallback(() => {
    const flat = PRESETS[0];
    handleApplyPreset(flat);
    setPreAmp(0);
    setStereoPan(0);
    audioEngine.setStereoPan(0);
  }, [handleApplyPreset]);

  // --- Playlist Handlers ---
  const handleCreatePlaylist = useCallback((name: string, description: string) => {
    const newPl: Playlist = {
      id: generateId(),
      name,
      description,
      trackIds: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists((prev) => [...prev, newPl]);
    setActivePlaylistId(newPl.id);
  }, []);

  const handleAddToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId && !pl.trackIds.includes(trackId)) {
          return { ...pl, trackIds: [...pl.trackIds, trackId] };
        }
        return pl;
      })
    );
  }, []);

  // --- Import Local/Cloud Audio Files ---
  const handleImportFiles = useCallback(
    async (files: FileList) => {
      const newCustomTracks: Track[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
          continue;
        }

        const fileUrl = URL.createObjectURL(file);
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[0-9]+[-_.\s]*/, '');

        // Estimate duration
        const audioProbe = new Audio(fileUrl);
        let dur = 180;
        await new Promise<void>((resolve) => {
          audioProbe.addEventListener('loadedmetadata', () => {
            dur = Math.round(audioProbe.duration) || 180;
            resolve();
          });
          setTimeout(resolve, 300);
        });

        let driveId: string | undefined;
        // Upload audio file directly to Google Drive if signed in!
        if (accessToken) {
          try {
            const uploadRes = await driveDatabase.uploadAudioFile(accessToken, file);
            driveId = uploadRes.fileId;
          } catch (uploadErr) {
            console.warn('Failed to upload audio to Google Drive:', uploadErr);
          }
        }

        const newTrack: Track = {
          id: generateId(),
          title: cleanTitle,
          artist: driveId ? 'Drive Online Audio' : 'Local Audio',
          album: driveId ? 'Google Drive Storage' : 'Imported Audio',
          duration: dur,
          coverUrl: DEFAULT_TRACKS[0].coverUrl,
          audioUrl: fileUrl,
          genre: driveId ? 'Drive Stream' : 'Custom',
          synthMood: 'chill',
          isCustom: true,
          driveFileId: driveId,
        };

        newCustomTracks.push(newTrack);
      }

      if (newCustomTracks.length > 0) {
        setTracks((prev) => [...newCustomTracks, ...prev]);
        handlePlayTrack(newCustomTracks[0]);

        if (accessToken) {
          setTimeout(() => {
            pushSyncToDrive();
          }, 300);
        }
      }
    },
    [accessToken, handlePlayTrack, pushSyncToDrive]
  );

  const handleDeleteCustomTrack = useCallback(
    (trackId: string) => {
      const targetTrack = tracks.find((t) => t.id === trackId);
      if (targetTrack?.driveFileId && accessToken) {
        setConfirmModal({
          isOpen: true,
          title: 'Delete from Google Drive',
          description: `Are you sure you want to delete "${targetTrack.title}" from your Google Drive storage? The cloud audio file and library record will be permanently deleted.`,
          confirmLabel: 'Delete from Drive',
          isDestructive: true,
          onConfirm: async () => {
            if (targetTrack.driveFileId) {
              await driveDatabase.deleteFile(accessToken, targetTrack.driveFileId);
            }
            setTracks((prev) => prev.filter((t) => t.id !== trackId));
            if (currentTrack?.id === trackId) {
              handlePauseTrack();
              setCurrentTrack(null);
            }
            setTimeout(() => {
              pushSyncToDrive();
            }, 300);
          },
        });
        return;
      }

      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      if (currentTrack?.id === trackId) {
        handlePauseTrack();
        setCurrentTrack(null);
      }
    },
    [tracks, accessToken, currentTrack, handlePauseTrack, pushSyncToDrive]
  );

  // --- Drag and Drop File Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImportFiles(e.dataTransfer.files);
    }
  };

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.05));
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'l' || e.key === 'L') {
        if (currentTrack) handleToggleLike(currentTrack.id);
      } else if (e.key === 's' || e.key === 'S') {
        handleToggleShuffle();
      } else if (e.key === 'r' || e.key === 'R') {
        handleCycleRepeat();
      } else if (e.key === 'e' || e.key === 'E') {
        setIsEqOpen((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFocusMode((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsEqOpen(false);
        setShowLyrics(false);
        setShowQueue(false);
        setIsCreatePlaylistOpen(false);
        setIsShortcutsOpen(false);
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePlayPause,
    handleSeek,
    currentTime,
    duration,
    handleVolumeChange,
    volume,
    handleToggleMute,
    handleToggleLike,
    currentTrack,
    handleToggleShuffle,
    handleCycleRepeat,
  ]);

  // --- Filter and Search Logic ---
  const filteredTracks = useMemo(() => {
    return activeTrackList.filter((track) => {
      const matchSearch =
        searchQuery === '' ||
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.genre.toLowerCase().includes(searchQuery.toLowerCase());

      const matchGenre =
        selectedGenre === 'all' ||
        track.genre.toLowerCase() === selectedGenre.toLowerCase();

      return matchSearch && matchGenre;
    });
  }, [activeTrackList, searchQuery, selectedGenre]);

  const uniqueGenres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.genre));
    return Array.from(set);
  }, [tracks]);

  // Unique Albums
  const albumGroups = useMemo(() => {
    const map = new Map<string, { album: string; artist: string; coverUrl: string; tracks: Track[] }>();
    tracks.forEach((t) => {
      if (!map.has(t.album)) {
        map.set(t.album, { album: t.album, artist: t.artist, coverUrl: t.coverUrl, tracks: [] });
      }
      map.get(t.album)!.tracks.push(t);
    });
    return Array.from(map.values());
  }, [tracks]);

  // Unique Artists
  const artistGroups = useMemo(() => {
    const map = new Map<string, { artist: string; coverUrl: string; tracks: Track[] }>();
    tracks.forEach((t) => {
      if (!map.has(t.artist)) {
        map.set(t.artist, { artist: t.artist, coverUrl: t.coverUrl, tracks: [] });
      }
      map.get(t.artist)!.tracks.push(t);
    });
    return Array.from(map.values());
  }, [tracks]);

  // Header Title derivation
  const headerTitle = useMemo(() => {
    if (activePlaylistId) {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      return pl ? pl.name : 'PLAYLIST';
    }
    if (activeTab === 'favorites') return 'LIKED SONGS';
    if (activeTab === 'albums') return 'ALBUMS';
    if (activeTab === 'artists') return 'ARTISTS';
    return 'ALL TRACKS';
  }, [activePlaylistId, activeTab, playlists]);

  const headerSubtitle = useMemo(() => {
    if (activePlaylistId) {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      return pl?.description;
    }
    return `${filteredTracks.length} tracks`;
  }, [activePlaylistId, playlists, filteredTracks.length]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-screen w-screen overflow-hidden bg-[#07090e] text-slate-100 font-sans"
    >
      {/* Dynamic Ambient Lighting Orbs for Glass Refraction */}
      <div className="absolute -top-24 -left-20 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-transparent blur-[140px] pointer-events-none animate-orb-1 z-0" />
      <div className="absolute bottom-10 right-0 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-violet-600/15 to-transparent blur-[150px] pointer-events-none animate-orb-2 z-0" />
      <div className="absolute top-[35%] right-[25%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-transparent blur-[130px] pointer-events-none z-0" />

      {/* File Drop Indicator Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center border-4 border-dashed border-amber-400 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 animate-bounce">
            <Music className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold font-mono text-white">Drop Audio Files Here</p>
          <p className="text-xs font-mono text-amber-300 mt-1">
            Supports MP3, WAV, FLAC, OGG, M4A
          </p>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="relative z-10 flex h-full">
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setActivePlaylistId(null);
          }}
          playlists={playlists}
          activePlaylistId={activePlaylistId}
          onSelectPlaylist={(plId) => {
            setActivePlaylistId(plId);
            setActiveTab('playlist');
          }}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onImportFiles={handleImportFiles}
          favoritesCount={likedTrackIds.size}
          totalTracksCount={tracks.length}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCloudOnline={Boolean(user && accessToken)}
        />
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          genres={uniqueGenres}
          deckMode={deckMode}
          onSelectDeckMode={setDeckMode}
          onOpenEqualizer={() => setIsEqOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          title={headerTitle}
          subtitle={headerSubtitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          user={user}
          isAuthLoading={isAuthLoading}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onManualSync={() => pushSyncToDrive()}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-36 space-y-8">
          {/* Upper Stage: Now Playing Deck & Real-time Visualizer Strip */}
          {currentTrack && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 glass-surface rounded-3xl p-6 relative overflow-hidden">
              {/* Deck Player Stage (Left 7 cols or full) */}
              <div className="xl:col-span-8 flex items-center justify-center">
                <NowPlayingDeck
                  track={currentTrack}
                  isPlaying={isPlaying}
                  viewMode={deckMode}
                  currentTime={currentTime}
                  duration={duration}
                  isLiked={likedTrackIds.has(currentTrack.id)}
                  onToggleLike={handleToggleLike}
                  onAddToQueue={handleAddToQueue}
                  onOpenLyrics={() => setShowLyrics(true)}
                />
              </div>

              {/* Real-time Hardware Visualizer Rack (Right 4 cols) */}
              <div className="xl:col-span-4 flex flex-col justify-between bg-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] h-64 xl:h-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                      SPECTRUM ANALYZER
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">
                    {visualizerMode.toUpperCase()}
                  </span>
                </div>

                {/* Canvas Visualizer */}
                <div className="flex-1 min-h-[160px] rounded-xl overflow-hidden relative">
                  <Visualizer
                    mode={visualizerMode}
                    isPlaying={isPlaying}
                    accentColor="#f59e0b"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/10">
                  <span>20 Hz</span>
                  <span>1 kHz</span>
                  <span>20 kHz</span>
                </div>
              </div>
            </div>
          )}

          {/* Lower Stage: Library Views */}
          {activeTab === 'albums' ? (
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4">
                Albums ({albumGroups.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {albumGroups.map((album) => (
                  <div
                    key={album.album}
                    className="glass-card rounded-2xl p-3.5 hover:border-white/20 transition-all group cursor-pointer"
                    onClick={() => {
                      if (album.tracks.length > 0) handlePlayTrack(album.tracks[0]);
                    }}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-800/80 border border-white/10 shadow-md">
                      <img
                        src={album.coverUrl}
                        alt={album.album}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition-opacity"
                        title="Play Album"
                      >
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{album.album}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{album.artist}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      {album.tracks.length} tracks
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'artists' ? (
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4">
                Artists ({artistGroups.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {artistGroups.map((artist) => (
                  <div
                    key={artist.artist}
                    className="glass-card rounded-2xl p-4 text-center hover:border-white/20 transition-all group cursor-pointer"
                    onClick={() => {
                      if (artist.tracks.length > 0) handlePlayTrack(artist.tracks[0]);
                    }}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white/20 shadow-lg">
                      <img
                        src={artist.coverUrl}
                        alt={artist.artist}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{artist.artist}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      {artist.tracks.length} tracks
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    {activePlaylistId ? 'Playlist Tracks' : 'Track Catalog'}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    ({filteredTracks.length} total)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (filteredTracks.length > 0) {
                        handlePlayTrack(filteredTracks[0]);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold font-mono hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play All</span>
                  </button>

                  <button
                    onClick={() => {
                      if (filteredTracks.length > 0) {
                        const randomIdx = Math.floor(Math.random() * filteredTracks.length);
                        handlePlayTrack(filteredTracks[randomIdx]);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-slate-300 text-xs font-mono hover:bg-white/10 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>

              {/* Table Card */}
              <div className="glass-surface rounded-2xl p-3 border border-white/10">
                <TrackList
                  tracks={filteredTracks}
                  currentTrackId={currentTrack?.id || null}
                  isPlaying={isPlaying}
                  likedTrackIds={likedTrackIds}
                  playlists={playlists}
                  onPlayTrack={handlePlayTrack}
                  onPauseTrack={handlePauseTrack}
                  onToggleLike={handleToggleLike}
                  onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={handleAddToPlaylist}
                  onDeleteCustomTrack={handleDeleteCustomTrack}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Drawers: Synced Lyrics & Play Queue */}
      <LyricsDrawer
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        track={currentTrack}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      <QueueDrawer
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
        currentTrack={currentTrack}
        queue={queue}
        onPlayTrack={handlePlayTrack}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
      />

      {/* Fixed Bottom Player Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          playbackRate={playbackRate}
          visualizerMode={visualizerMode}
          deckMode={deckMode}
          isLiked={currentTrack ? likedTrackIds.has(currentTrack.id) : false}
          sleepTimerSeconds={sleepTimerSeconds}
          showLyrics={showLyrics}
          showQueue={showQueue}
          onPlayPause={handleTogglePlayPause}
          onSeek={handleSeek}
          onPrev={handlePrev}
          onNext={handleNext}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleShuffle={handleToggleShuffle}
          onCycleRepeat={handleCycleRepeat}
          onCyclePlaybackRate={handleCyclePlaybackRate}
          onCycleVisualizer={handleCycleVisualizer}
          onCycleDeckMode={handleCycleDeckMode}
          onToggleLike={handleToggleLike}
          onToggleLyrics={() => setShowLyrics((prev) => !prev)}
          onToggleQueue={() => setShowQueue((prev) => !prev)}
          onOpenEqualizer={() => setIsEqOpen(true)}
          onSetSleepTimer={handleSetSleepTimer}
          onEnterFocusMode={() => setIsFocusMode(true)}
        />
      </div>

      {/* Modals & Overlays */}
      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        gains={eqGains}
        onChangeGain={handleChangeEqGain}
        onApplyPreset={handleApplyPreset}
        activePresetName={activePresetName}
        preAmp={preAmp}
        onChangePreAmp={handleChangePreAmp}
        stereoPan={stereoPan}
        onChangeStereoPan={handleChangeStereoPan}
        onReset={handleResetEq}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={handleCreatePlaylist}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <FocusModeOverlay
        isOpen={isFocusMode}
        onClose={() => setIsFocusMode(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        visualizerMode={visualizerMode}
        onPlayPause={handleTogglePlayPause}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Google Drive Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        userEmail={user?.email || undefined}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        cloudDb={cloudDb}
        onPushSync={() => pushSyncToDrive()}
        onPullRestore={() => {
          if (accessToken) {
            loadCloudData(accessToken, user?.email || undefined);
          }
        }}
        onRequestDeleteCloudData={handleRequestDeleteCloudData}
      />

      {/* Confirmation Modal for Destructive Cloud Operations */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
