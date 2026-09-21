import { useState } from "react";
import { Music, Pencil, Play, Plus, Trash2 } from "lucide-react";
import IconButton from "./IconButton";
import MediaInput from "./MediaInput";
import Modal, { SheetHeader, SheetSecondaryAction } from "./Modal";
import { Input } from "@/components/ui/input";
import { AUDIO_ACCEPT, fileToDataUrl } from "@/lib/file";
import { REACTION_ICONS } from "@/lib/reactionIcons";
import { REACTION_KINDS, REACTION_LABELS, playReaction, playSound } from "@/lib/reactions";
import { MAX_REACTION_BYTES, useReactionStore } from "@/store/useReactionStore";

type Draft = {
  /** null while creating a new reaction. */
  id: string | null;
  name: string;
  icon: string;
  /** Fresh data URL replacement; undefined keeps the existing sound. */
  sound?: string;
};

const IconTile: React.FC<{ iconKey: string }> = ({ iconKey }) => {
  const Icon = REACTION_ICONS[iconKey] ?? REACTION_ICONS.music;
  return (
    <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </span>
  );
};

/** Manage the reaction dock: preview built-ins, add/edit/remove custom sounds. */
const ReactionManagerSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { customs, add, update, remove } = useReactionStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const readSound = async (file: File) => {
    if (file.size > MAX_REACTION_BYTES) {
      setError(`That sound is too large (max ${Math.round(MAX_REACTION_BYTES / 1024)} KB)`);
      return;
    }
    try {
      const sound = await fileToDataUrl(file);
      setDraft((prev) => (prev ? { ...prev, sound } : prev));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that sound");
    }
  };

  const save = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return;
    if (draft.id) {
      update(draft.id, { name, icon: draft.icon, ...(draft.sound ? { sound: draft.sound } : {}) });
    } else if (draft.sound) {
      add({ name, icon: draft.icon, sound: draft.sound });
    } else {
      return;
    }
    setDraft(null);
  };

  return (
    <Modal onClose={draft ? undefined : onClose} className="max-h-[80vh] flex flex-col">
      <SheetHeader
        title="Reactions"
        description="Built-ins always stay; add your own sounds on top."
      />

      <div className="overflow-y-auto">
        {REACTION_KINDS.map((kind) => (
          <div key={kind} className="flex items-center gap-3 px-4 py-2.5 border-t first:border-t-0">
            <IconTile iconKey={kind} />
            <span className="flex-1 min-w-0 flex items-baseline gap-2">
              <span className="font-medium truncate">{REACTION_LABELS[kind]}</span>
              <span className="text-xs text-muted-foreground">Built-in</span>
            </span>
            <IconButton aria-label={`Play ${REACTION_LABELS[kind]}`} onClick={() => void playReaction(kind)}>
              <Play className="w-4 h-4" />
            </IconButton>
          </div>
        ))}

        {customs.map((reaction) => (
          <div key={reaction.id} className="flex items-center gap-3 px-4 py-2.5 border-t">
            <IconTile iconKey={reaction.icon} />
            <span className="flex-1 min-w-0 font-medium truncate">{reaction.name}</span>
            <IconButton aria-label={`Play ${reaction.name}`} onClick={() => void playSound(reaction.id, reaction.sound)}>
              <Play className="w-4 h-4" />
            </IconButton>
            <IconButton
              aria-label={`Edit ${reaction.name}`}
              className="text-primary hover:bg-primary/10"
              onClick={() => {
                setDraft({ id: reaction.id, name: reaction.name, icon: reaction.icon });
                setError("");
              }}
            >
              <Pencil className="w-4 h-4" />
            </IconButton>
            <IconButton danger aria-label={`Remove ${reaction.name}`} onClick={() => remove(reaction.id)}>
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </div>
        ))}

        {customs.length === 0 && (
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            No custom reactions yet — add one below.
          </div>
        )}
      </div>

      <div className="p-4 border-t space-y-3">
        {draft ? (
          <>
            <Input
              placeholder="Reaction name"
              value={draft.name}
              maxLength={24}
              autoFocus
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <div className="flex flex-wrap gap-2">
              {Object.entries(REACTION_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: key })}
                  aria-label={`Choose ${key} icon`}
                  aria-pressed={draft.icon === key}
                  className={`size-10 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
                    draft.icon === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <MediaInput
                accept={AUDIO_ACCEPT}
                onFile={(file) => void readSound(file)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-muted hover:bg-accent transition-colors text-sm font-medium"
              >
                <Music className="w-4 h-4" />
                {draft.sound ? "Sound chosen — tap to replace" : draft.id ? "Replace sound (optional)" : "Choose a sound"}
              </MediaInput>
              {draft.sound && (
                <IconButton
                  round
                  aria-label="Preview sound"
                  className="bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => void playSound("preview", draft.sound!)}
                >
                  <Play className="w-4 h-4" />
                </IconButton>
              )}
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex gap-2">
              <SheetSecondaryAction onClick={() => { setDraft(null); setError(""); }} className="flex-1">
                Cancel
              </SheetSecondaryAction>
              <button
                type="button"
                onClick={save}
                disabled={!draft.name.trim() || (!draft.id && !draft.sound)}
                className="flex-1 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Save
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft({ id: null, name: "", icon: Object.keys(REACTION_ICONS)[3] ?? "music" });
              setError("");
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add reaction
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ReactionManagerSheet;
