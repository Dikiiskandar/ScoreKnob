import React, { useRef, useState, useEffect } from "react";
import { RotateCw, Plus, Trash2, Edit2, X, Trophy, Medal, MoreVertical } from "lucide-react";

type Player = {
  id: number;
  name: string;
  score: number;
  previousScore: number;
  previousRank: number;
  pendingScore: number;
};

const RADIUS = 120;
const CENTER = RADIUS + 40;

const initialPlayers: Player[] = [];

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

  const containerRef = useRef<HTMLDivElement>(null);
  const previousAngleRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const getAngle = (x: number, y: number): number => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    let angle = Math.atan2(dy, dx);
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

  const handleSubmit = () => {
    // Calculate current ranks before commit for previous rank tracking
    const currentRanking = [...players]
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ id: p.id, previousRank: index }));

    // Commit all pending scores to actual scores and update previous scores
    setPlayers(prev =>
      prev.map(p => ({
        ...p,
        previousScore: p.score,
        previousRank: currentRanking.find(r => r.id === p.id)?.previousRank ?? 0,
        score: p.pendingScore
      }))
    );
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
      setRounds(prev => prev.map(round => [...round, { id: newId, name: newPlayerName.trim(), score: 0, previousScore: 0, previousRank: -1, pendingScore: 0 }]));
      setNewPlayerName("");
    }
  };

  const deletePlayer = (id: number) => {
    setRounds(prev => prev.map(round => round.filter(p => p.id !== id)));
    if (activePlayerId === id) {
      setActivePlayerId(null);
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

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center font-bold text-muted-foreground">#{rank + 1}</span>;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className={`w-full h-[60px] flex items-center justify-between gap-4 px-4 shadow-md transition-all ${activePlayerId ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground' : 'bg-muted text-foreground'}`}>
        <div className="font-bold text-lg">{activePlayerId ? players.find((p) => p.id === activePlayerId)?.name : 'ScoreKnob'}</div>
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

            return players.map((player, index) => {
              const rotationOffset = players.length === 4 ? Math.PI / 4 : 0;
              const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2 + rotationOffset;

              const LABEL_RADIUS = RADIUS + 40;
              const x = CENTER + LABEL_RADIUS * Math.cos(angle);
              const y = CENTER + LABEL_RADIUS * Math.sin(angle);
              const currentRank = finalRanks.find(r => r.id === player.id)?.rank ?? index;
              const hasRanking = player.previousRank >= 0;
              const rankChange = player.previousRank - currentRank;
              const isFirstRank = currentRank === 0 && hasRanking;
              const isLastRank = currentRank === players.length - 1 && hasRanking;

              return (
                <div
                  key={player.id}
                  className={`absolute w-[80px] text-center cursor-pointer select-none p-2 rounded-xl transition-all duration-200 ${
                    activePlayerId === player.id 
                      ? 'bg-primary text-primary-foreground shadow-2xl scale-110 ring-4 ring-primary/30 animate-pulse' 
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
                  <div className="flex items-center justify-center gap-1 h-4">
                    {isFirstRank && <Trophy className="w-3 h-3 text-yellow-500" />}
                    {isLastRank && <span className="text-[10px] text-red-400 font-bold">LAST</span>}
                    {hasRanking && rankChange !== 0 && (
                      <span className={`text-[10px] ${rankChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                      </span>
                    )}
                  </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Manage Players</h2>
            </div>
            
            {/* Add New Player */}
            <div className="p-4 border-b">
              <div className="flex gap-2">
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
                      <div className="flex-1">
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-muted-foreground">Score: {player.score}</div>
                      </div>
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
                onClick={resetAllData}
                className="w-full px-4 py-2 bg-red-500/20 text-red-600 rounded-md hover:bg-red-500/30 transition-colors"
              >
                Reset All Data
              </button>
              <button
                onClick={() => setShowPlayerManager(false)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

                return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    index === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                    index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                    'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-center w-10">
                    {getRankIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2 truncate">
                      {player.name}
                      {hasRanking && rankChange !== 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          rankChange > 0 ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                        }`}>
                          {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange)}
                        </span>
                      )}
                    </div>
                    {player.previousScore !== player.score && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        was {player.previousScore}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-primary">{player.score}</div>
                    {player.score !== player.previousScore && (
                      <div className={`text-sm font-semibold ${
                        player.score > player.previousScore ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {player.score > player.previousScore ? '+' : ''}{player.score - player.previousScore}
                      </div>
                    )}
                  </div>
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
                onClick={() => setShowLeaderboard(false)}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
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
