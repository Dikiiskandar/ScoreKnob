import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ALargeSmall, ArrowLeftRight, Check, Download, Languages, Minus, RotateCcw, Smile, Undo2, Volume2, VolumeX } from "lucide-react";
import FloatingDock from "@/components/FloatingDock";
import IconButton from "@/components/IconButton";
import IosInstallSheet from "@/components/IosInstallSheet";
import Modal, { SheetHeader, SheetRow } from "@/components/Modal";
import ReactionManagerSheet from "@/components/ReactionManagerSheet";
import RoundSwitcher from "@/components/RoundSwitcher";
import { useInstallAction } from "@/hooks/useInstallAction";
import { useOrientationLock } from "@/hooks/useOrientationLock";
import { useReactionDock } from "@/hooks/useReactionDock";
import { useSpeech } from "@/hooks/useSpeech";
import { preloadReactions } from "@/lib/reactions";

type Side = "home" | "away";
type Scores = Record<Side, number>;

type VersusState = {
  names: Record<Side, string>;
  rounds: Scores[];
  currentRound: number;
  /** When false, names disappear from the scoreboard and the announcements. */
  showNames: boolean;
};

const STORAGE_KEY = "scoreKnobVersus";

const emptyScores = (): Scores => ({ home: 0, away: 0 });

const defaultState: VersusState = {
  names: { home: "Home", away: "Away" },
  rounds: [emptyScores()],
  currentRound: 0,
  showNames: true,
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
      showNames: parsed.showNames ?? true,
    };
  } catch {
    return defaultState;
  }
};

/** A round belongs to whoever scored more in it; equal scores belong to nobody. */
const roundsWonBy = (side: Side, rounds: Scores[]) =>
  rounds.filter((round) => round[side] > round[side === "home" ? "away" : "home"]).length;

const languageName = (lang: string) => {
  if (lang === "auto") return "System default";
  try {
    const locale = navigator.language || "en";
    const [primary, region] = lang.split("-");
    const language = new Intl.DisplayNames([locale], { type: "language" }).of(primary) ?? primary;
    const regionName = region ? new Intl.DisplayNames([locale], { type: "region" }).of(region) : undefined;
    return `${language}${regionName ? ` (${regionName})` : ""}`;
  } catch {
    return lang;
  }
};

const SidePanel: React.FC<{
  side: Side;
  name: string;
  showName: boolean;
  score: number;
  onScore: () => void;
  onDecrement: () => void;
  onRename: (name: string) => void;
}> = ({ side, name, showName, score, onScore, onDecrement, onRename }) => {
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
      aria-label={showName ? `Add a point for ${name}` : "Add a point"}
      className={`relative flex-1 flex flex-col items-center justify-center gap-4 select-none transition-colors active:brightness-110 ${
        side === "home" ? "bg-primary/10" : "bg-muted"
      }`}
    >
      {showName &&
        (editing ? (
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
        ))}

      <span className="text-7xl sm:text-9xl font-bold tabular-nums text-foreground">{score}</span>

      <IconButton
        round
        aria-label={showName ? `Remove a point from ${name}` : "Remove a point"}
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        className="size-11 border bg-card shadow-sm"
      >
        <Minus className="w-5 h-5" />
      </IconButton>
    </div>
  );
};

const Versus: React.FC = () => {
  const [state, setState] = useState<VersusState>(loadState);
  const reactionItems = useReactionDock();
  const [showReactions, setShowReactions] = useState<boolean>(false);
  /** Undo stacks per round index, so switching rounds keeps each history intact. */
  const history = useRef<Record<number, Scores[]>>({});
  const {
    enabled: speechOn,
    setEnabled: setSpeechOn,
    speak,
    supported: speechSupported,
    languages,
    lang,
    setLang,
  } = useSpeech();
  const [showLangSheet, setShowLangSheet] = useState(false);
  const { showInstallAction, showIosInstall, handleInstall, closeIosInstall } = useInstallAction();

  // Side-by-side scoring only fits in landscape; devices that reject the lock keep the portrait layout.
  useOrientationLock("landscape");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(preloadReactions, []);

  const { names, rounds, currentRound, showNames } = state;
  const scores = rounds[currentRound];

  const setRound = (index: number, next: Scores) =>
    setState((prev) => ({ ...prev, rounds: prev.rounds.map((round, i) => (i === index ? next : round)) }));

  const announce = (next: Scores) =>
    speak(
      showNames
        ? `${names.home} ${next.home}, ${names.away} ${next.away}`
        : `${next.home}, ${next.away}`,
    );

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

  /** Swap home/away everywhere so the left and right panels trade places. */
  const swapSides = () => {
    setState((prev) => ({
      ...prev,
      names: { home: prev.names.away, away: prev.names.home },
      rounds: prev.rounds.map((round) => ({ home: round.away, away: round.home })),
    }));
    announce({ home: scores.away, away: scores.home });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-[calc(56px+var(--safe-top))] pt-safe flex items-center justify-between px-2 border-b bg-card">
        <Link to="/" aria-label="ScoreKnob" className="shrink-0">
          <img src="./logo.svg" className="w-6 h-6" alt="ScoreKnob" />
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          <span>{roundsWonBy("home", rounds)}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">rounds won</span>
          <span>{roundsWonBy("away", rounds)}</span>
        </div>
        <div className="flex items-center gap-1">
          {speechSupported && (
            <IconButton
              active={speechOn}
              onClick={() => {
                const next = !speechOn;
                setSpeechOn(next);
                // Speaking straight from the tap keeps iOS from muting later announcements.
                if (next) speak(`${names.home} ${scores.home}, ${names.away} ${scores.away}`, true);
              }}
              aria-label={speechOn ? "Turn off score announcements" : "Announce the score out loud"}
              aria-pressed={speechOn}
            >
              {speechOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </IconButton>
          )}
          <IconButton
            active={showNames}
            onClick={() => setState((prev) => ({ ...prev, showNames: !prev.showNames }))}
            aria-label={showNames ? "Hide team names" : "Show team names"}
            aria-pressed={showNames}
          >
            <ALargeSmall className="w-5 h-5" />
          </IconButton>
          {speechSupported && (
            <IconButton onClick={() => setShowLangSheet(true)} aria-label="Choose speech language">
              <Languages className="w-5 h-5" />
            </IconButton>
          )}
          <IconButton onClick={undo} aria-label="Undo last change">
            <Undo2 className="w-5 h-5" />
          </IconButton>
          <IconButton onClick={resetAll} aria-label="Reset all rounds">
            <RotateCcw className="w-5 h-5" />
          </IconButton>
          {showInstallAction && (
            <IconButton onClick={handleInstall} aria-label="Install app">
              <Download className="w-5 h-5" />
            </IconButton>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex divide-x pb-[var(--safe-bottom)]">
        {(["home", "away"] as Side[]).map((side) => (
          <SidePanel
            key={side}
            side={side}
            name={names[side]}
            showName={showNames}
            score={scores[side]}
            onScore={() => bump(side, 1)}
            onDecrement={() => bump(side, -1)}
            onRename={(name) => setState((prev) => ({ ...prev, names: { ...prev.names, [side]: name } }))}
          />
        ))}

        <IconButton
          round
          onClick={swapSides}
          aria-label="Swap home and away sides"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-12 bg-card text-foreground border shadow-md hover:bg-accent"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </IconButton>

        <RoundSwitcher
          count={rounds.length}
          current={currentRound}
          position="absolute"
          maxWidth="max-w-[50vw]"
          onSelect={(index) => setState((prev) => ({ ...prev, currentRound: index }))}
          onAdd={addRound}
        />
      </div>

      <FloatingDock
        items={reactionItems}
        icon={Smile}
        label="Reactions"
        storageKey="scoreKnobReactionDock"
        onManage={() => setShowReactions(true)}
      />

      {showReactions && <ReactionManagerSheet onClose={() => setShowReactions(false)} />}

      {showLangSheet && (
        <Modal variant="bottom" onClose={() => setShowLangSheet(false)}>
          <SheetHeader
            title="Speech language"
            description="Used when announcing the score."
          />
          <div className="overflow-y-auto max-h-[50vh]">
            <SheetRow
              active={lang === "auto"}
              onClick={() => {
                setLang("auto");
                setShowLangSheet(false);
              }}
            >
              <span className="flex-1 text-left">{languageName("auto")}</span>
              {lang === "auto" && <Check className="w-5 h-5" />}
            </SheetRow>
            {languages.map((voiceLang) => (
              <SheetRow
                key={voiceLang}
                active={lang === voiceLang}
                onClick={() => {
                  setLang(voiceLang);
                  setShowLangSheet(false);
                }}
              >
                <span className="flex-1 text-left">{languageName(voiceLang)}</span>
                {lang === voiceLang && <Check className="w-5 h-5" />}
              </SheetRow>
            ))}
            {languages.length === 0 && (
              <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                No voices available yet — reloading the page may fix it.
              </div>
            )}
          </div>
        </Modal>
      )}

      {showIosInstall && <IosInstallSheet appName="Diki Lab" onClose={closeIosInstall} />}
    </div>
  );
};

export default Versus;
