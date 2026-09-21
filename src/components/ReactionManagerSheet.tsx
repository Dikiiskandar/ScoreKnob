import { useState } from "react";
import { Check, GripVertical, Lock, Music, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import IconButton from "./IconButton";
import MediaInput from "./MediaInput";
import Modal, { SheetHeader, SheetSecondaryAction } from "./Modal";
import { Input } from "@/components/ui/input";
import { AUDIO_ACCEPT, fileToDataUrl } from "@/lib/file";
import { REACTION_ICONS } from "@/lib/reactionIcons";
import { REACTION_KINDS, REACTION_LABELS, playReaction, playSound } from "@/lib/reactions";
import { MAX_REACTION_BYTES, useReactionStore } from "@/store/useReactionStore";
import type { CustomGroup } from "@/store/useReactionStore";

type Draft = {
  /** null while creating a new reaction. */
  id: string | null;
  groupId: string;
  name: string;
  /** Optional; without one the button shows the name's first letter. */
  icon?: string;
  /** Fresh data URL replacement; undefined keeps the existing sound. */
  sound?: string;
};

/** Vertical drag state while sorting; hovering another group's rows moves there. */
type Drag = {
  reactionId: string;
  pointerId: number;
  startY: number;
  fromGroupId: string;
  from: number;
  /** Same-group target index; only meaningful while toGroupId === fromGroupId. */
  to: number;
  toGroupId: string;
  /** Insertion slot inside the target group while dragging across groups. */
  slot: number;
  dy: number;
  rowH: number;
  count: number;
};

const IconTile: React.FC<{ iconKey?: string; label: string }> = ({ iconKey, label }) => {
  const Icon = iconKey ? REACTION_ICONS[iconKey] : undefined;
  return (
    <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
      {Icon ? (
        <Icon className="w-5 h-5" />
      ) : (
        <span className="text-base font-semibold uppercase">
          {label.trim().slice(0, 2) || "?"}
        </span>
      )}
    </span>
  );
};

/**
 * Manage the reaction dock: the locked default group holds the built-ins, and
 * the user can add their own groups, drop reactions into them, drag them into
 * order, and move them between groups.
 */
const ReactionManagerSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { customs, groups, add, update, remove, move, relocate, addGroup, renameGroup, removeGroup } =
    useReactionStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  /** Non-null while naming a brand new group in the footer. */
  const [newGroupName, setNewGroupName] = useState<string | null>(null);
  /** Group whose header label is being edited inline. */
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const startDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    reactionId: string,
    groupId: string,
    index: number,
    count: number,
  ) => {
    const handle = event.currentTarget;
    const row = handle.closest<HTMLElement>("[data-reaction-row]");
    const rowH = row?.offsetHeight || 61;
    handle.setPointerCapture(event.pointerId);
    setDrag({
      reactionId,
      pointerId: event.pointerId,
      startY: event.clientY,
      fromGroupId: groupId,
      from: index,
      to: index,
      toGroupId: groupId,
      slot: index,
      dy: 0,
      rowH,
      count,
    });
  };

  const updateDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Rows translate while sorting, so hit-test against the live DOM instead
    // of relying on React state.
    const hovered = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-drop-group]");
    setDrag((prev) => {
      if (!prev || prev.pointerId !== event.pointerId) return prev;
      const dy = event.clientY - prev.startY;
      const zoneId = hovered?.dataset.dropGroup;
      if (!zoneId || zoneId === prev.fromGroupId) {
        // Same group (or outside any zone): clamp the travel to its bounds.
        const clampedDy = Math.min(
          Math.max(dy, -prev.from * prev.rowH),
          (prev.count - 1 - prev.from) * prev.rowH,
        );
        return {
          ...prev,
          dy: clampedDy,
          toGroupId: prev.fromGroupId,
          to: prev.from + Math.round(clampedDy / prev.rowH),
          slot: prev.from,
        };
      }
      // Crossing into another group: insert before the row under the pointer.
      const rows = Array.from(hovered.querySelectorAll<HTMLElement>("[data-reaction-row]"));
      let slot = rows.length;
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        // Undo the shift already applied while hovering so midpoints stay stable.
        const shifted =
          prev.toGroupId === zoneId && Number(row.dataset.index) >= prev.slot ? prev.rowH : 0;
        if (event.clientY < rect.top - shifted + rect.height / 2) {
          slot = Number(row.dataset.index);
          break;
        }
      }
      return { ...prev, dy, toGroupId: zoneId, slot, to: prev.from };
    });
  };

  const endDrag = () => {
    if (drag) {
      if (drag.toGroupId === drag.fromGroupId) {
        if (drag.to !== drag.from) move(drag.fromGroupId, drag.from, drag.to);
      } else {
        relocate(drag.reactionId, drag.toGroupId, drag.slot);
      }
    }
    setDrag(null);
  };

  /** Siblings of the dragged row slide aside to mark the drop slot. */
  const rowShift = (groupId: string, index: number): number => {
    if (!drag) return 0;
    const { fromGroupId, from, toGroupId, to, slot, rowH } = drag;
    if (toGroupId === fromGroupId) {
      if (groupId !== fromGroupId || index === from) return 0;
      if (from < to && index > from && index <= to) return -rowH;
      if (to < from && index >= to && index < from) return rowH;
      return 0;
    }
    // Cross-group: close the gap left in the source, open the slot in the target.
    if (groupId === fromGroupId) return index > from ? -rowH : 0;
    if (groupId === toGroupId) return index >= slot ? rowH : 0;
    return 0;
  };

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

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name || !groups.some((g) => g.id === draft.groupId)) return;
    if (draft.id) {
      update(draft.id, {
        name,
        icon: draft.icon,
        groupId: draft.groupId,
        ...(draft.sound ? { sound: draft.sound } : {}),
      });
    } else if (draft.sound) {
      add({ name, icon: draft.icon, groupId: draft.groupId, sound: draft.sound });
    } else {
      return;
    }
    setDraft(null);
  };

  const saveGroup = () => {
    if (newGroupName === null) return;
    const name = newGroupName.trim();
    if (!name) return;
    addGroup(name);
    setNewGroupName(null);
  };

  const saveRename = () => {
    if (!renaming) return;
    const name = renaming.name.trim();
    if (name) renameGroup(renaming.id, name);
    setRenaming(null);
  };

  const deleteGroup = (group: CustomGroup, count: number) => {
    if (
      count > 0 &&
      !window.confirm(`Delete "${group.name}" and its ${count} reaction${count === 1 ? "" : "s"}?`)
    ) {
      return;
    }
    if (draft?.groupId === group.id) setDraft(null);
    if (renaming?.id === group.id) setRenaming(null);
    removeGroup(group.id);
  };

  const editing = draft !== null || newGroupName !== null;

  return (
    <Modal onClose={editing ? undefined : onClose} className="max-h-[80vh] flex flex-col">
      <SheetHeader
        title="Reactions"
        description="The default group and its reactions can't be changed; add your own groups below."
      />

      <div className={`overflow-y-auto ${drag ? "select-none" : ""}`}>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50">
          <span className="flex-1 text-sm font-semibold text-muted-foreground">Default</span>
          <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-label="Locked" />
        </div>
        {REACTION_KINDS.map((kind) => (
          <div key={kind} className="flex items-center gap-3 px-4 py-2.5 border-t">
            <IconTile iconKey={kind} label={REACTION_LABELS[kind]} />
            <span className="flex-1 min-w-0 flex items-baseline gap-2">
              <span className="font-medium truncate">{REACTION_LABELS[kind]}</span>
              <span className="text-xs text-muted-foreground">Built-in</span>
            </span>
            <IconButton aria-label={`Play ${REACTION_LABELS[kind]}`} onClick={() => void playReaction(kind)}>
              <Play className="w-4 h-4" />
            </IconButton>
          </div>
        ))}

        {groups.map((group) => {
          const items = customs.filter((r) => r.groupId === group.id);
          return (
            <div key={group.id} data-drop-group={group.id}>
              <div className="flex items-center gap-1 px-4 py-2 bg-muted/50 border-t">
                {renaming?.id === group.id ? (
                  <>
                    <Input
                      value={renaming.name}
                      maxLength={24}
                      autoFocus
                      onChange={(e) => setRenaming({ id: group.id, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="flex-1 h-8"
                    />
                    <IconButton
                      aria-label="Save group name"
                      className="text-primary hover:bg-primary/10"
                      onClick={saveRename}
                    >
                      <Check className="w-4 h-4" />
                    </IconButton>
                    <IconButton aria-label="Cancel rename" onClick={() => setRenaming(null)}>
                      <X className="w-4 h-4" />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <span className="flex-1 min-w-0 text-sm font-semibold text-muted-foreground truncate">
                      {group.name}
                    </span>
                    <IconButton
                      aria-label={`Add a reaction to ${group.name}`}
                      className="size-8 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setDraft({ id: null, groupId: group.id, name: "" });
                        setNewGroupName(null);
                        setError("");
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      aria-label={`Rename ${group.name}`}
                      className="size-8"
                      onClick={() => setRenaming({ id: group.id, name: group.name })}
                    >
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      danger
                      aria-label={`Delete ${group.name}`}
                      className="size-8"
                      onClick={() => deleteGroup(group, items.length)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
              </div>

              {items.map((reaction, index) => {
                const isDragged =
                  drag !== null && drag.fromGroupId === group.id && drag.from === index;
                const shift = isDragged ? (drag?.dy ?? 0) : rowShift(group.id, index);
                return (
                  <div
                    key={reaction.id}
                    data-reaction-row
                    data-index={index}
                    className={`flex items-center gap-3 px-4 py-2.5 border-t ${
                      isDragged
                        ? "relative z-10 bg-card shadow-lg"
                        : drag
                          ? "transition-transform"
                          : ""
                    }`}
                    style={{ transform: shift ? `translateY(${shift}px)` : undefined }}
                  >
                    <button
                      type="button"
                      aria-label={`Reorder or move ${reaction.name}`}
                      className="shrink-0 -ml-1 text-muted-foreground/50 cursor-grab active:cursor-grabbing touch-none"
                      onPointerDown={(e) => startDrag(e, reaction.id, group.id, index, items.length)}
                      onPointerMove={updateDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <IconTile iconKey={reaction.icon} label={reaction.name} />
                    <span className="flex-1 min-w-0 font-medium truncate">{reaction.name}</span>
                    <IconButton aria-label={`Play ${reaction.name}`} onClick={() => void playSound(reaction.id, reaction.sound)}>
                      <Play className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      aria-label={`Edit ${reaction.name}`}
                      className="text-primary hover:bg-primary/10"
                      onClick={() => {
                        setDraft({ id: reaction.id, groupId: reaction.groupId, name: reaction.name, icon: reaction.icon });
                        setError("");
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton danger aria-label={`Remove ${reaction.name}`} onClick={() => remove(reaction.id)}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                  No reactions in this group yet — tap + above to add one.
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            Create a group below to add your own sounds.
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
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, groupId: group.id })}
                  aria-pressed={draft.groupId === group.id}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-95 ${
                    draft.groupId === group.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, icon: undefined })}
                aria-label="Use the name's first letter instead of an icon"
                aria-pressed={!draft.icon}
                className={`size-10 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
                  !draft.icon
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-foreground hover:bg-accent"
                }`}
              >
                <span className="text-sm font-semibold uppercase">
                  {draft.name.trim().slice(0, 2) || "Aa"}
                </span>
              </button>
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
                onClick={saveDraft}
                disabled={!draft.name.trim() || (!draft.id && !draft.sound)}
                className="flex-1 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Save
              </button>
            </div>
          </>
        ) : newGroupName !== null ? (
          <>
            <Input
              placeholder="Group name"
              value={newGroupName}
              maxLength={24}
              autoFocus
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveGroup();
                if (e.key === "Escape") setNewGroupName(null);
              }}
            />
            <div className="flex gap-2">
              <SheetSecondaryAction onClick={() => setNewGroupName(null)} className="flex-1">
                Cancel
              </SheetSecondaryAction>
              <button
                type="button"
                onClick={saveGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Save
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setNewGroupName("")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add group
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ReactionManagerSheet;
