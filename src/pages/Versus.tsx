import React, { useEffect, useRef, useState } from "react";
import { Frown, Hand, Laugh, Minus, Plus, RotateCcw, Smile, Undo2, Volume2, VolumeX } from "lucide-react";
import FloatingDock, { type DockItem } from "@/components/FloatingDock";
import { useOrientationLock } from "@/hooks/useOrientationLock";
import { useSpeech } from "@/hooks/useSpeech";
import { playReaction, preloadReactions } from "@/lib/reactions";

type Side = "home" | "away";
type Scores = Record<Side, number>;

type VersusState = {
  names: Record<Side, string>;
  rounds: Scores[];
  currentRound: number;
};

const STORAGE_KEY = "scoreKnobVersus";

const emptyScores = (): Scores => ({ home: 0, away: 0 });

const defaultState: VersusState = {
  names: { home: "Home", away: "Away" },
  rounds: [emptyScores()],
  currentRound: 0,
};

const loadState = (): VersusState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState;
  try {
    // Older versions stored a single `scores` object instead of a list of rounds.
    const parsed = JSON.parse(saved) as Partial<VersusState> & { scores?: Scores };
    const rounds = parsed.rounds?.length ? parsed.rounds : [{ ...emptyScores(), ...parsed.scores }];
    return {
      names: { ...defaultState.names, ...parsed.names },
      rounds,
      currentRound: Math.min(parsed.currentRound ?? 0, rounds.length - 1),
    };
  } catch {
    return defaultState;
  }
};

const REACTIONS: DockItem[] = [
  { id: "applause", icon: Hand, label: "Applause", onSelect: () => void playReaction("applause") },
  { id: "laugh", icon: Laugh, label: "Laugh", onSelect: () => void playReaction("laugh") },
  { id: "sad", icon: Frown, label: "Sad", onSelect: () => void playReaction("sad") },
];

/** A round belongs to whoever scored more in it; equal scores belong to nobody. */
const roundsWonBy = (side: Side, rounds: Scores[]) =>
  rounds.filter((round) => round[side] > round[side === "home" ? "away" : "home"]).length;

const SidePanel: React.FC<{
  side: Side;
  name: string;
  score: number;
  onScore: () => void;
  onDecrement: () => void;
  onRename: (name: string) => void;
}> = ({ side, name, score, onScore, onDecrement, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const trimmed = draft.trim();
    onRename(trimmed || defaultState.names[side]);
    setEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onScore}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onScore();
        }
      }}
      aria-label={`Add a point for ${name}`}
      className={`relative flex-1 flex flex-col items-center justify-center gap-4 select-none transition-colors active:brightness-110 ${
        side === "home" ? "bg-primary/10" : "bg-muted"
      }`}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(name);
              setEditing(false);
            }
          }}
          maxLength={20}
          className="w-4/5 max-w-xs rounded-lg border bg-card px-3 py-2 text-center text-lg font-semibold"
        />
      ) : (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setDraft(name);
            setEditing(true);
          }}
          className="text-lg font-semibold uppercase tracking-widest text-muted-foreground underline-offset-4 hover:underline"
        >
          {name}
        </span>
      )}

      <span className="text-7xl sm:text-9xl font-bold tabular-nums text-foreground">{score}</span>

      <span
        role="button"
        tabIndex={0}
        aria-label={`Remove a point from ${name}`}
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            onDecrement();
          }
        }}
        className="rounded-full border bg-card p-3 text-muted-foreground shadow-sm transition-colors hover:bg-accent"
      >
        <Minus className="w-5 h-5" />
      </span>
    </div>
  );
};

const Versus: React.FC = () => {
  const [state, setState] = useState<VersusState>(loadState);
  /** Undo stacks per round index, so switching rounds keeps each history intact. */
  const history = useRef<Record<number, Scores[]>>({});
  const { enabled: speechOn, setEnabled: setSpeechOn, speak, supported: speechSupported } = useSpeech();
  // Side-by-side scoring only fits in landscape; devices that reject the lock keep the portrait layout.
  useOrientationLock("landscape");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(preloadReactions, []);

  const { names, rounds, currentRound } = state;
  const scores = rounds[currentRound];

  const setRound = (index: number, next: Scores) =>
    setState((prev) => ({ ...prev, rounds: prev.rounds.map((round, i) => (i === index ? next : round)) }));

  const announce = (next: Scores) => speak(`${names.home} ${next.home}, ${names.away} ${next.away}`);

  const bump = (side: Side, delta: number) => {
    const stack = history.current[currentRound] ?? [];
    history.current[currentRound] = [...stack.slice(-49), scores];
    const next = { ...scores, [side]: Math.max(0, scores[side] + delta) };
    setRound(currentRound, next);
    announce(next);
  };

  const undo = () => {
    const previous = history.current[currentRound]?.pop();
    if (!previous) return;
    setRound(currentRound, previous);
    announce(previous);
  };

  const resetAll = () => {
    if (!confirm("Reset every round and start over?")) return;
    history.current = {};
    setState((prev) => ({ ...prev, rounds: [emptyScores()], currentRound: 0 }));
  };

  const addRound = () =>
    setState((prev) => ({ ...prev, rounds: [...prev.rounds, emptyScores()], currentRound: prev.rounds.length }));

  return (
    <div className="h-full flex flex-col">
      <div className="h-[calc(56px+var(--safe-top))] pt-safe flex items-center justify-between px-2 border-b bg-card">
        <span className="px-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Versus</span>
        <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          <span>{roundsWonBy("home", rounds)}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">rounds won</span>
          <span>{roundsWonBy("away", rounds)}</span>
        </div>
        <div className="flex items-center gap-1">
          {speechSupported && (
            <button
              onClick={() => {
                const next = !speechOn;
                setSpeechOn(next);
                // Speaking straight from the tap keeps iOS from muting later announcements.
                if (next) speak(`${names.home} ${scores.home}, ${names.away} ${scores.away}`, true);
              }}
              aria-label={speechOn ? "Turn off score announcements" : "Announce the score out loud"}
              aria-pressed={speechOn}
              className={`rounded-lg p-2 hover:bg-accent ${speechOn ? "text-primary" : "text-muted-foreground"}`}
            >
              {speechOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={undo}
            aria-label="Undo last change"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={resetAll}
            aria-label="Reset all rounds"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex divide-x pb-[var(--safe-bottom)]">
        {(["home", "away"] as Side[]).map((side) => (
          <SidePanel
            key={side}
            side={side}
            name={names[side]}
            score={scores[side]}
            onScore={() => bump(side, 1)}
            onDecrement={() => bump(side, -1)}
            onRename={(name) => setState((prev) => ({ ...prev, names: { ...prev.names, [side]: name } }))}
          />
        ))}

        <div className="absolute bottom-[calc(1rem+var(--safe-bottom))] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 max-w-[50vw] overflow-x-auto rounded-full bg-card/90 px-3 py-2 shadow-2xl backdrop-blur-md">
          {rounds.map((_, index) => (
            <button
              key={index}
              onClick={() => setState((prev) => ({ ...prev, currentRound: index }))}
              aria-label={`Round ${index + 1}`}
              aria-current={currentRound === index}
              className={`w-10 h-10 flex-shrink-0 rounded-full text-sm font-bold transition-all ${
                currentRound === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={addRound}
            aria-label="Add round"
            className="w-10 h-10 flex-shrink-0 rounded-full bg-muted text-foreground hover:bg-accent flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <FloatingDock items={REACTIONS} icon={Smile} label="Reactions" storageKey="scoreKnobReactionDock" />
    </div>
  );
};

export default Versus;
