import React, { useRef, useState, useEffect } from "react";
import { RotateCw, Plus, Trash2, Edit2, X, Trophy, Medal, MoreVertical, Download, WifiOff, Share, Camera, Crown, TrendingDown, TrendingUp, ChevronsUpDown, ArrowDown, Image as ImageIcon, Mic, Square, Play, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useVoiceRecorder, canRecordVoice, recordUnavailableReason, MAX_VOICE_MS } from "@/hooks/useVoiceRecorder";
import { fileToSquareDataUrl } from "@/lib/image";
import { fileToDataUrl } from "@/lib/file";

type Player = {
  id: number;
  name: string;
  score: number;
  previousScore: number;
  previousRank: number;
  pendingScore: number;
  photo?: string;
  voice?: string;
};

const RADIUS = 120;
const CENTER = RADIUS + 40;
/** Voice clips live in localStorage, so keep imported sounds small. */
const MAX_VOICE_BYTES = 200 * 1024;

const initialPlayers: Player[] = [];

/** Renders nothing when the player has no photo. */
const PlayerAvatar: React.FC<{ player: Player; className?: string }> = ({ player, className = "" }) =>
  player.photo ? (
    <img src={player.photo} alt={player.name} className={`rounded-full object-cover ${className}`} />
  ) : null;

const MediaInput: React.FC<{
  onFile: (file: File) => void;
  accept?: string;
  /** Ask the device for its camera/recorder instead of the file browser. */
  capture?: boolean | "user" | "environment";
  className?: string;
  title?: string;
  children: React.ReactNode;
}> = ({ onFile, accept = "image/*", capture, className = "", title, children }) => (
  <label className={`cursor-pointer ${className}`} title={title}>
    <input
      type="file"
      accept={accept}
      capture={capture}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
    />
    {children}
  </label>
);

/** Lets the user pick a photo source: the camera or a file on the device. */
const PhotoSourceSheet: React.FC<{
  onFile: (file: File) => void;
  onRemove?: () => void;
  onClose: () => void;
}> = ({ onFile, onRemove, onClose }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+var(--safe-bottom))]"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b font-semibold">Player photo</div>
      <MediaInput
        capture="environment"
        onFile={(file) => { onClose(); onFile(file); }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
      >
        <Camera className="w-5 h-5 text-primary" />
        Take a photo
      </MediaInput>
      <MediaInput
        onFile={(file) => { onClose(); onFile(file); }}
        className="flex items-center gap-3 px-4 py-3 border-t hover:bg-accent transition-colors"
      >
        <ImageIcon className="w-5 h-5 text-primary" />
        Choose from files
      </MediaInput>
      {onRemove && (
        <button
          onClick={() => { onClose(); onRemove(); }}
          className="w-full flex items-center gap-3 px-4 py-3 border-t text-red-600 hover:bg-red-600/10 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          Remove photo
        </button>
      )}
      <button
        onClick={onClose}
        className="w-full px-4 py-3 border-t text-muted-foreground hover:bg-accent transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
);

/** Record, preview or clear the clip that plays when a player gets highlighted. */
const VoiceSheet: React.FC<{
  player: Player;
  isRecording: boolean;
  isPlaying: boolean;
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
  onPlay: () => void;
  onStopPlay: () => void;
  onFile: (file: File) => void;
  onRemove: () => void;
  onClose: () => void;
}> = ({ player, isRecording, isPlaying, elapsedMs, onStart, onStop, onPlay, onStopPlay, onFile, onRemove, onClose }) => (
  <div
    onClick={isRecording ? undefined : onClose}
    className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+var(--safe-bottom))]"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b">
        <div className="font-semibold">Voice for {player.name}</div>
        <div className="text-xs text-muted-foreground">
          Plays automatically when this player is highlighted after a submit (max {MAX_VOICE_MS / 1000}s).
        </div>
      </div>
      {isRecording ? (
        <button
          onClick={onStop}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/10 text-red-600 hover:bg-red-600/20 transition-colors"
        >
          <Square className="w-5 h-5" />
          <span className="flex-1 text-left">Stop recording</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="font-mono text-sm tabular-nums">
              {(elapsedMs / 1000).toFixed(1)}s / {MAX_VOICE_MS / 1000}s
            </span>
          </span>
        </button>
      ) : canRecordVoice() ? (
        <button
          onClick={onStart}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
        >
          <Mic className="w-5 h-5 text-primary" />
          {player.voice ? 'Record again' : 'Start recording'}
        </button>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 text-xs text-muted-foreground">
          <Mic className="w-5 h-5 flex-shrink-0 opacity-50" />
          <span>{recordUnavailableReason()} You can still pick a sound file below.</span>
        </div>
      )}
      {!isRecording && (
        <MediaInput
          accept="audio/*"
          onFile={onFile}
          className="flex items-center gap-3 px-4 py-3 border-t hover:bg-accent transition-colors"
        >
          <Volume2 className="w-5 h-5 text-primary" />
          {player.voice ? 'Replace with a sound file' : 'Choose a sound file'}
        </MediaInput>
      )}
      {player.voice && !isRecording && (
        <>
          <button
            onClick={isPlaying ? onStopPlay : onPlay}
            className={`w-full flex items-center gap-3 px-4 py-3 border-t transition-colors ${
              isPlaying ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-accent'
            }`}
          >
            {isPlaying ? <Square className="w-5 h-5 text-primary" /> : <Play className="w-5 h-5 text-primary" />}
            <span className="flex-1 text-left">{isPlaying ? 'Playing…' : 'Play back'}</span>
            {isPlaying && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
          </button>
          <button
            onClick={() => { onClose(); onRemove(); }}
            className="w-full flex items-center gap-3 px-4 py-3 border-t text-red-600 hover:bg-red-600/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Remove voice
          </button>
        </>
      )}
      <button
        onClick={isRecording ? onStop : onClose}
        className="w-full px-4 py-3 border-t text-muted-foreground hover:bg-accent transition-colors"
      >
        {isRecording ? 'Stop' : 'Close'}
      </button>
    </div>
  </div>
);

type HighlightType = "first" | "last" | "gain" | "drop";

type HighlightConfig = {
  id: HighlightType;
  label: string;
  icon: LucideIcon;
  card: string;
  accent: string;
  /** Higher is better: the winning player is the one with the largest value. */
  value: (player: Player) => number;
  /** Value rendered on the right of the card. */
  display: (player: Player) => string;
};

const HIGHLIGHTS: HighlightConfig[] = [
  {
    id: "first",
    label: "First rank",
    icon: Crown,
    card: "bg-yellow-500/10 border-yellow-500/40",
    accent: "text-yellow-600",
    value: (p) => p.score,
    display: (p) => String(p.score),
  },
  {
    id: "last",
    label: "Last rank",
    icon: ArrowDown,
    card: "bg-red-500/10 border-red-500/40",
    accent: "text-red-600",
    value: (p) => -p.score,
    display: (p) => String(p.score),
  },
  {
    id: "gain",
    label: "Biggest gain",
    icon: TrendingUp,
    card: "bg-green-500/10 border-green-500/40",
    accent: "text-green-600",
    value: (p) => p.score - p.previousScore,
    display: (p) => `+${p.score - p.previousScore}`,
  },
  {
    id: "drop",
    label: "Biggest drop",
    icon: TrendingDown,
    card: "bg-orange-500/10 border-orange-500/40",
    accent: "text-orange-600",
    value: (p) => p.previousScore - p.score,
    display: (p) => String(p.score - p.previousScore),
  },
];

const getHighlight = (players: Player[], type: HighlightType) => {
  const config = HIGHLIGHTS.find(h => h.id === type) ?? HIGHLIGHTS[0];
  if (players.length === 0) return { config, winners: [] as Player[], player: undefined, tiedWith: 0 };

  const values = players.map(p => config.value(p));
  const best = Math.max(...values);
  const tied = players.filter(p => config.value(p) === best);

  // Everyone tied (all equal scores, or nobody moved) means there is nothing to highlight.
  const isMeaningful = tied.length < players.length && (type === "first" || type === "last" || best > 0);
  const winners = isMeaningful ? tied : [];

  return {
    config,
    winners,
    player: winners[0],
    tiedWith: winners.length > 0 ? winners.length - 1 : 0,
  };
};

/** All highlights a player currently holds, keyed by player id. */
const getHighlightBadges = (players: Player[]) => {
  const badges = new Map<number, HighlightConfig[]>();
  HIGHLIGHTS.forEach(highlight => {
    getHighlight(players, highlight.id).winners.forEach(winner => {
      badges.set(winner.id, [...(badges.get(winner.id) ?? []), highlight]);
    });
  });
  return badges;
};

const KnobScoreboard: React.FC = () => {
  const [rounds, setRounds] = useState<Player[][]>(() => {
    const saved = localStorage.getItem('scoreKnobRounds');
    return saved ? JSON.parse(saved) : [initialPlayers];
  });
  const [currentRound, setCurrentRound] = useState<number>(() => {
    const saved = localStorage.getItem('scoreKnobCurrentRound');
    return saved ? Number(saved) : 0;
  });
  const players = rounds[currentRound] ?? [];

  const setPlayers = (updater: React.SetStateAction<Player[]>) => {
    setRounds(prev => prev.map((round, i) => {
      if (i !== currentRound) return round;
      const current = round ?? [];
      const next = typeof updater === 'function' ? (updater as (prev: Player[]) => Player[])(current) : updater;
      return next;
    }));
  };

  useEffect(() => {
    localStorage.setItem('scoreKnobRounds', JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem('scoreKnobCurrentRound', String(currentRound));
  }, [currentRound]);

  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [showPlayerManager, setShowPlayerManager] = useState<boolean>(false);
  const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState<string>("");
  const [showIosInstall, setShowIosInstall] = useState<boolean>(false);
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string>("");
  const [photoMenuFor, setPhotoMenuFor] = useState<number | "new" | null>(null);
  const [voiceMenuFor, setVoiceMenuFor] = useState<number | null>(null);
  const [playingFor, setPlayingFor] = useState<number | null>(null);
  const [voiceFileError, setVoiceFileError] = useState<string>("");
  const { recordingFor, elapsedMs, error: voiceError, start: startRecording, stop: stopRecording } = useVoiceRecorder();
  const [highlightType, setHighlightType] = useState<HighlightType>(() => {
    const saved = localStorage.getItem('scoreKnobHighlightType');
    return HIGHLIGHTS.some(h => h.id === saved) ? (saved as HighlightType) : 'first';
  });

  useEffect(() => {
    localStorage.setItem('scoreKnobHighlightType', highlightType);
  }, [highlightType]);

  const { canInstall, needsIosInstructions, isInstalled, isOffline, promptInstall } = usePwaInstall();
  const showInstallAction = !isInstalled && (canInstall || needsIosInstructions);

  const handleInstall = () => {
    setShowActionMenu(false);
    if (canInstall) {
      void promptInstall();
      return;
    }
    setShowIosInstall(true);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousAngleRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const getAngle = (x: number, y: number): number => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    const angle = Math.atan2(dy, dx);
    return angle < 0 ? angle + 2 * Math.PI : angle; // Normalize to 0-2PI
  };

  const updateKnobValue = (newAngle: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      let angleDifference = newAngle - previousAngleRef.current;

      // Normalize angle jump across 0/2PI boundary
      angleDifference =
        angleDifference < -Math.PI
          ? angleDifference + 2 * Math.PI
          : angleDifference > Math.PI
            ? angleDifference - 2 * Math.PI
            : angleDifference;

      const updatedTotalRotation = totalRotationRef.current + angleDifference;
      const rawDelta = Math.round(updatedTotalRotation) - Math.round(totalRotationRef.current);
      const deltaScore = rawDelta * multiplier;

      setRotationAngle(updatedTotalRotation);
      setPlayers(prev =>
        prev.map(p =>
          p.id === activePlayerId ? { ...p, pendingScore: p.pendingScore + deltaScore } : p
        )
      );

      previousAngleRef.current = newAngle;
      totalRotationRef.current = updatedTotalRotation;
      animationFrameRef.current = null;
    });
  };

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    playerId: number
  ) => {
    e.preventDefault();
    setActivePlayerId(playerId);
    setRotationAngle(0);
    setIsDragging(true);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const angle = getAngle(x, y);

    previousAngleRef.current = angle;
    totalRotationRef.current = 0;
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (activePlayerId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const angle = getAngle(x, y);

    updateKnobValue(angle);
  };

  const handleEnd = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setActivePlayerId(null);
    setRotationAngle(0);
    setIsDragging(false);
  };

  const playVoice = (player: Player) => {
    if (!player.voice) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingFor(null);
      audioRef.current.onerror = () => setPlayingFor(null);
    }
    audioRef.current.pause();
    audioRef.current.src = player.voice;
    audioRef.current.currentTime = 0;
    setPlayingFor(player.id);
    void audioRef.current.play().catch(() => setPlayingFor(null));
  };

  const stopVoice = () => {
    audioRef.current?.pause();
    setPlayingFor(null);
  };

  const handleSubmit = () => {
    // Calculate current ranks before commit for previous rank tracking
    const currentRanking = [...players]
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ id: p.id, previousRank: index }));

    // Commit all pending scores to actual scores and update previous scores
    const committed = players.map(p => ({
      ...p,
      previousScore: p.score,
      previousRank: currentRanking.find(r => r.id === p.id)?.previousRank ?? 0,
      score: p.pendingScore
    }));
    setPlayers(committed);

    // Cheer for whoever the highlight lands on with the new scores
    const { player } = getHighlight(committed, highlightType);
    if (player) playVoice(player);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [activePlayerId]);

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newId = Math.max(...rounds.flat().map(p => p.id), 0) + 1;
      setRounds(prev => prev.map(round => [...round, { id: newId, name: newPlayerName.trim(), score: 0, previousScore: 0, previousRank: -1, pendingScore: 0, photo: newPlayerPhoto }]));
      setNewPlayerName("");
      setNewPlayerPhoto(undefined);
    }
  };

  const readPhoto = async (file: File, apply: (photo: string | undefined) => void) => {
    try {
      apply(await fileToSquareDataUrl(file));
      setPhotoError("");
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not read that photo");
    }
  };

  const setPlayerPhoto = (id: number, photo: string | undefined) => {
    setRounds(prev => prev.map(round => round.map(p => p.id === id ? { ...p, photo } : p)));
  };

  const setPlayerVoice = (id: number, voice: string | undefined) => {
    setRounds(prev => prev.map(round => round.map(p => p.id === id ? { ...p, voice } : p)));
  };

  const readVoiceFile = async (id: number, file: File) => {
    if (file.size > MAX_VOICE_BYTES) {
      setVoiceFileError(`That sound is too large (max ${Math.round(MAX_VOICE_BYTES / 1024)} KB)`);
      return;
    }
    try {
      setPlayerVoice(id, await fileToDataUrl(file));
      setVoiceFileError("");
    } catch (error) {
      setVoiceFileError(error instanceof Error ? error.message : "Could not read that sound");
    }
  };

  const deletePlayer = (id: number) => {
    setRounds(prev => prev.map(round => round.filter(p => p.id !== id)));
    if (activePlayerId === id) {
      setActivePlayerId(null);
    }
    if (photoMenuFor === id) {
      setPhotoMenuFor(null);
    }
    if (voiceMenuFor === id) {
      setVoiceMenuFor(null);
    }
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  const savePlayerName = () => {
    if (editingPlayerId && editingPlayerName.trim()) {
      setRounds(prev => prev.map(round => round.map(p => p.id === editingPlayerId ? { ...p, name: editingPlayerName.trim() } : p)));
      setEditingPlayerId(null);
      setEditingPlayerName("");
    }
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerName("");
  };

  const resetAllData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      setRounds([initialPlayers]);
      setCurrentRound(0);
      setActivePlayerId(null);
      setRotationAngle(0);
      setMultiplier(1);
      setShowPlayerManager(false);
      setShowLeaderboard(false);
      localStorage.removeItem('scoreKnobRounds');
      localStorage.removeItem('scoreKnobCurrentRound');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const highlightBadges = getHighlightBadges(players);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center font-bold text-muted-foreground">#{rank + 1}</span>;
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      <div className={`w-full h-[calc(60px+var(--safe-top))] pt-safe flex items-center justify-between gap-4 px-4 shadow-md transition-all ${activePlayerId ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground' : 'bg-muted text-foreground'}`}>
        <div className="flex items-center gap-2">
          <div className="font-bold text-lg">{activePlayerId ? players.find((p) => p.id === activePlayerId)?.name : 'ScoreKnob'}</div>
          {isOffline && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-600 text-xs font-semibold" title="You are offline. Scores are saved on this device.">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </div>
        {
          activePlayerId && (() => {
            const activePlayer = players.find((p) => p.id === activePlayerId);
            if (!activePlayer) return null;
            const change = activePlayer.pendingScore - activePlayer.score;
            return (
              <div className="flex items-center gap-2 font-semibold text-xl">
                <span>{activePlayer.score}</span>
                <span className="text-sm opacity-75">{change >= 0 ? '+' : '-'}</span>
                <span className={change >= 0 ? 'text-green-300' : 'text-red-300'}>{Math.abs(change)}</span>
                <span className="text-sm opacity-75">=</span>
                <span>{activePlayer.pendingScore}</span>
              </div>
            );
          })()
        }
        <button
          onClick={() => {
            const multipliers = [1, 5, 10, 25];
            const currentIndex = multipliers.indexOf(multiplier);
            const nextIndex = (currentIndex + 1) % multipliers.length;
            setMultiplier(multipliers[nextIndex]);
          }}
          className="w-12 h-12 rounded-full bg-background/30 text-foreground border-2 border-foreground/40 flex items-center justify-center text-sm font-bold shadow-md active:scale-95 transition-all hover:bg-background/50"
        >
          {multiplier}x
        </button>
      </div>
      {/* Player Highlight */}
      {players.length > 0 && (() => {
        const { config, player, tiedWith } = getHighlight(players, highlightType);
        const Icon = config.icon;

        return (
          <div className="px-4 pt-3">
            <button
              onClick={() => {
                const nextIndex = (HIGHLIGHTS.findIndex(h => h.id === config.id) + 1) % HIGHLIGHTS.length;
                setHighlightType(HIGHLIGHTS[nextIndex].id);
              }}
              title="Tap to change highlight"
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.99] ${
                player ? config.card : 'bg-muted border-border'
              }`}
            >
              {player ? (
                <PlayerAvatar player={player} className="w-9 h-9 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-background/70 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${player ? config.accent : 'text-muted-foreground'}`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </div>
                <div className="font-semibold text-sm truncate flex items-center gap-1">
                  {player ? player.name : 'Nothing to highlight yet'}
                  {player && tiedWith > 0 && <span className="text-muted-foreground font-normal">+{tiedWith}</span>}
                  {player && playingFor === player.id && <Volume2 className="w-3 h-3 text-primary animate-pulse flex-shrink-0" />}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {player && <span className="text-lg font-bold text-primary">{config.display(player)}</span>}
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </div>
        );
      })()}
      <div className="flex-1 flex justify-center items-center p-4 w-full overflow-visible">
        <div
          ref={containerRef}
          className={`relative w-[320px] h-[320px] rounded-full border-4 touch-none bg-card shadow-2xl transition-all ${activePlayerId ? 'border-primary ring-4 ring-primary/20' : 'border-border'} ${isDragging ? 'ring-8 ring-primary/40' : ''}`}
        >
          {isDragging && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: `rotate(${(rotationAngle * 180) / Math.PI}deg)` }}
            >
              <defs>
                <linearGradient id="rotationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <circle
                cx="160"
                cy="160"
                r={RADIUS - 10}
                fill="none"
                stroke="url(#rotationGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.abs(rotationAngle) * RADIUS} ${2 * Math.PI * RADIUS}`}
                className="text-primary"
                style={{ filter: isDragging ? 'drop-shadow(0 0 10px currentColor)' : 'none' }}
              />
            </svg>
          )}
          {(() => {
            const finalRanks = [...players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => ({ id: p.id, rank: i }));
            const highlight = getHighlight(players, highlightType);

            return players.map((player, index) => {
              const rotationOffset = players.length === 4 ? Math.PI / 4 : 0;
              const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2 + rotationOffset;

              const LABEL_RADIUS = RADIUS + 40;
              const x = CENTER + LABEL_RADIUS * Math.cos(angle);
              const y = CENTER + LABEL_RADIUS * Math.sin(angle);
              const currentRank = finalRanks.find(r => r.id === player.id)?.rank ?? index;
              const hasRanking = player.previousRank >= 0;
              const rankChange = player.previousRank - currentRank;
              const isHighlighted = highlight.winners.some(w => w.id === player.id);
              const badges = highlightBadges.get(player.id) ?? [];

              return (
                <div
                  key={player.id}
                  className={`absolute w-[80px] text-center cursor-pointer select-none p-2 rounded-xl transition-all duration-200 ${
                    activePlayerId === player.id 
                      ? 'bg-primary text-primary-foreground shadow-2xl scale-110 ring-4 ring-primary/30 animate-pulse' 
                      : isHighlighted
                        ? `border ${highlight.config.card} text-foreground hover:scale-105`
                        : 'bg-muted text-foreground hover:bg-accent hover:scale-105'
                  } ${activePlayerId && activePlayerId !== player.id ? 'opacity-40 blur-[1px]' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%)`,
                    transformOrigin: 'center center',
                  }}
                  onMouseDown={(e) => handleStart(e, player.id)}
                  onTouchStart={(e) => handleStart(e, player.id)}
                >
                  <div className="flex items-center justify-center gap-0.5 h-4">
                    {playingFor === player.id && <Volume2 className="w-3 h-3 text-primary animate-pulse" />}
                    {badges.map(({ id, icon: BadgeIcon, label, accent }) => (
                      <span key={id} title={label} className={id === highlightType ? '' : 'opacity-50'}>
                        <BadgeIcon className={`w-3 h-3 ${accent}`} />
                      </span>
                    ))}
                    {hasRanking && rankChange !== 0 && (
                      <span className={`text-[10px] ${rankChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                      </span>
                    )}
                  </div>
                  <PlayerAvatar player={player} className="w-10 h-10 mx-auto" />
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {player.name}
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`text-2xl font-bold ${activePlayerId === player.id ? 'text-primary-foreground' : 'text-primary'}`}>
                      {player.pendingScore}
                    </div>
                    {player.pendingScore !== player.score && (
                      <div className="text-xs opacity-75">
                        ({player.score})
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
          {(() => {
            const hasPendingChanges = players.some(p => p.pendingScore !== p.score);

            return (
              <div
                onClick={hasPendingChanges ? handleSubmit : undefined}
                className={`absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
                  hasPendingChanges
                    ? 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 hover:scale-105'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                } ${isDragging && hasPendingChanges ? 'scale-110 shadow-2xl ring-4 ring-primary/50' : ''}`}
              >
                Submit
              </div>
            );
          })()}
        </div>
      </div>

      {/* Leaderboard Toggle */}
      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        >
          <Trophy className="w-6 h-6" />
        </button>
      </div>
      
      {showActionMenu && (
        <div
          onClick={() => setShowActionMenu(false)}
          className="fixed inset-0 z-50 bg-black/70 cursor-pointer"
        />
      )}

      {/* Action Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          {showActionMenu && (
            <div className="absolute right-0 bottom-16 flex flex-col gap-2">
              {showInstallAction && (
                <button
                  onClick={handleInstall}
                  className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
                  title="Add to home screen"
                >
                  <Download className="w-6 h-6" />
                </button>
              )}
              <button
                onClick={() => { setShowPlayerManager(true); setShowActionMenu(false); }}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
                title="Add player"
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                onClick={() => { resetAllData(); setShowActionMenu(false); }}
                className="w-14 h-14 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all flex items-center justify-center"
                title="Reset all"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className="relative z-10 w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center"
          >
            {showActionMenu ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Player Management Panel */}
      {showPlayerManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pt-[calc(1rem+var(--safe-top))]">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Manage Players</h2>
            </div>
            
            {/* Add New Player */}
            <div className="p-4 border-b">
              <div className="flex gap-2">
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setPhotoMenuFor(photoMenuFor === 'new' ? null : 'new')}
                    title="Add photo"
                    className="w-10 h-10 rounded-full bg-muted border border-input flex items-center justify-center overflow-hidden hover:bg-accent transition-colors"
                  >
                    {newPlayerPhoto ? (
                      <img src={newPlayerPhoto} alt="New player" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {photoMenuFor === 'new' && (
                    <PhotoSourceSheet
                      onFile={(file) => void readPhoto(file, setNewPlayerPhoto)}
                      onRemove={newPlayerPhoto ? () => setNewPlayerPhoto(undefined) : undefined}
                      onClose={() => setPhotoMenuFor(null)}
                    />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={addPlayer}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {(photoError || voiceError || voiceFileError) && (
                <div className="mt-2 text-xs text-red-600">{photoError || voiceError || voiceFileError}</div>
              )}
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                >
                  {editingPlayerId === player.id ? (
                    <>
                      <input
                        type="text"
                        value={editingPlayerName}
                        onChange={(e) => setEditingPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && savePlayerName()}
                        className="flex-1 px-2 py-1 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                      />
                      <button
                        onClick={savePlayerName}
                        className="p-2 text-green-600 hover:bg-green-600/10 rounded-md transition-colors"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 text-red-600 hover:bg-red-600/10 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setPhotoMenuFor(photoMenuFor === player.id ? null : player.id)}
                          title={player.photo ? "Change photo" : "Add photo"}
                          className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-border hover:ring-primary transition-all flex items-center justify-center bg-background"
                        >
                          {player.photo ? (
                            <PlayerAvatar player={player} className="w-full h-full" />
                          ) : (
                            <Camera className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {photoMenuFor === player.id && (
                          <PhotoSourceSheet
                            onFile={(file) => void readPhoto(file, (photo) => setPlayerPhoto(player.id, photo))}
                            onRemove={player.photo ? () => setPlayerPhoto(player.id, undefined) : undefined}
                            onClose={() => setPhotoMenuFor(null)}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate flex items-center gap-1">
                          {player.name}
                          {recordingFor === player.id ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 flex-shrink-0">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                              REC
                            </span>
                          ) : playingFor === player.id ? (
                            <Volume2 className="w-3 h-3 text-primary flex-shrink-0 animate-pulse" />
                          ) : player.voice ? (
                            <Volume2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground">Score: {player.score}</div>
                      </div>
                      <button
                        onClick={() => setVoiceMenuFor(player.id)}
                        title={player.voice ? "Change voice" : "Record voice"}
                        className={`p-2 rounded-md transition-colors ${
                          recordingFor === player.id
                            ? 'text-red-600 bg-red-600/10 animate-pulse'
                            : player.voice ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      {voiceMenuFor === player.id && (
                        <VoiceSheet
                          player={player}
                          isRecording={recordingFor === player.id}
                          isPlaying={playingFor === player.id}
                          elapsedMs={elapsedMs}
                          onStart={() => void startRecording(player.id, (voice) => setPlayerVoice(player.id, voice))}
                          onStop={stopRecording}
                          onPlay={() => playVoice(player)}
                          onStopPlay={stopVoice}
                          onFile={(file) => void readVoiceFile(player.id, file)}
                          onRemove={() => { stopVoice(); setPlayerVoice(player.id, undefined); }}
                          onClose={() => setVoiceMenuFor(null)}
                        />
                      )}
                      <button
                        onClick={() => startEditingPlayer(player)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="p-2 text-red-600 hover:bg-red-600/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-2">
              <button
                onClick={() => { setShowPlayerManager(false); setPhotoMenuFor(null); setVoiceMenuFor(null); setPhotoError(""); stopRecording(); stopVoice(); }}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pt-[calc(1rem+var(--safe-top))]">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Leaderboard
              </h2>
            </div>

            {/* Leaderboard List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedPlayers.map((player, index) => {
                const hasRanking = player.previousRank >= 0;
                const rankChange = player.previousRank - index;
                const badges = highlightBadges.get(player.id) ?? [];

                return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    index === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                    index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                    'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-center w-6 flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <PlayerAvatar player={player} className="w-10 h-10 flex-shrink-0 ring-1 ring-border" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{player.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      {badges.map(({ id, icon: BadgeIcon, label, accent }) => (
                        <span key={id} title={label} className={id === highlightType ? '' : 'opacity-50'}>
                          <BadgeIcon className={`w-3.5 h-3.5 ${accent}`} />
                        </span>
                      ))}
                      {hasRanking && rankChange !== 0 && (
                        <span className={`font-bold ${rankChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                        </span>
                      )}
                      {player.previousScore !== player.score && <span>was {player.previousScore}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="text-2xl font-bold text-primary leading-none">{player.score}</div>
                    {player.score !== player.previousScore && (
                      <div className={`text-xs font-semibold mt-0.5 ${
                        player.score > player.previousScore ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {player.score > player.previousScore ? '+' : ''}{player.score - player.previousScore}
                      </div>
                    )}
                  </div>
                  {player.voice && (
                    <button
                      onClick={() => playingFor === player.id ? stopVoice() : playVoice(player)}
                      title={playingFor === player.id ? "Stop voice" : "Play voice"}
                      className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                        playingFor === player.id
                          ? 'bg-primary text-primary-foreground animate-pulse'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {playingFor === player.id ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              );
              })}
              {sortedPlayers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No players yet. Add some players to get started!
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => { setShowLeaderboard(false); stopVoice(); }}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add to Home Screen (iOS) */}
      {showIosInstall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pt-[calc(1rem+var(--safe-top))]">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Add to Home Screen</h2>
            <p className="text-sm text-muted-foreground">
              Install ScoreKnob to play offline with a full-screen app icon.
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs">1</span>
                <span className="flex items-center gap-1">
                  Tap the <Share className="w-4 h-4 inline" /> Share button in Safari
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs">2</span>
                <span className="flex items-center gap-1">
                  Choose <Plus className="w-4 h-4 inline" /> Add to Home Screen
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs">3</span>
                <span>Tap Add to confirm</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstall(false)}
              className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Round Switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-md rounded-full shadow-2xl max-w-[calc(100vw-170px)] overflow-x-auto z-40">
        {rounds.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentRound(index)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
              currentRound === index ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'
            }`}
          >
            {index + 1}
          </button>
        ))}
        <button
          onClick={() => {
            setRounds(prev => [...prev, prev[currentRound].map(p => ({ ...p, score: 0, previousScore: 0, previousRank: -1, pendingScore: 0 }))]);
            setCurrentRound(rounds.length);
          }}
          className="w-10 h-10 rounded-full bg-muted text-foreground hover:bg-accent flex items-center justify-center text-sm font-bold flex-shrink-0"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default KnobScoreboard;
