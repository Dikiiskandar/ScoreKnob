import { create } from "zustand";

export type CustomGroup = {
  id: string;
  name: string;
};

export type CustomReaction = {
  id: string;
  /** Custom group this reaction belongs to; built-ins live in DEFAULT_GROUP_ID. */
  groupId: string;
  name: string;
  /** Key into the shared icon picker map; without one the button shows the name's first letter. */
  icon?: string;
  /** Data URL of an audio file, kept small so localStorage copes. */
  sound: string;
};

/** Built-in reactions always sit in this group; the group and its members are read-only. */
export const DEFAULT_GROUP_ID = "default";

/** Sounds live in localStorage next to voice clips, so stay small. */
export const MAX_REACTION_BYTES = 200 * 1024;

const REACTIONS_KEY = "scoreKnobCustomReactions";
const GROUPS_KEY = "scoreKnobCustomReactionGroups";
/** Reactions saved before groups existed get moved into this new group on load. */
const MIGRATION_GROUP_NAME = "Custom";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const persist = (groups: CustomGroup[], customs: CustomReaction[]) => {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(customs));
  } catch {
    // Storage is full (large clips); the change is dropped with the state.
  }
};

const load = (): { groups: CustomGroup[]; customs: CustomReaction[] } => {
  let groups: CustomGroup[] = [];
  let customs: CustomReaction[] = [];

  try {
    const saved = JSON.parse(localStorage.getItem(GROUPS_KEY) ?? "") as unknown;
    if (Array.isArray(saved)) {
      groups = saved.filter(
        (g): g is CustomGroup =>
          !!g && typeof g.id === "string" && typeof g.name === "string",
      );
    }
  } catch {
    // No usable groups stored yet.
  }

  try {
    const saved = JSON.parse(localStorage.getItem(REACTIONS_KEY) ?? "") as unknown;
    if (Array.isArray(saved)) {
      customs = saved
        .filter(
          (r): r is Omit<CustomReaction, "groupId"> & { groupId?: string } =>
            !!r && typeof r.id === "string" && typeof r.name === "string" &&
            (r.icon === undefined || typeof r.icon === "string") && typeof r.sound === "string",
        )
        .map((r) => ({ ...r, groupId: r.groupId ?? "" }));
    }
  } catch {
    // No usable reactions stored yet.
  }

  // Reactions pointing at a missing group (e.g. saved before groups existed)
  // get a home of their own so nothing the user made is dropped.
  const known = new Set(groups.map((g) => g.id));
  if (customs.some((r) => !known.has(r.groupId))) {
    const fallback: CustomGroup = { id: newId(), name: MIGRATION_GROUP_NAME };
    groups = [...groups, fallback];
    customs = customs.map((r) => (known.has(r.groupId) ? r : { ...r, groupId: fallback.id }));
    // Save right away so the generated group id stays stable across reloads.
    persist(groups, customs);
  }

  return { groups, customs };
};

interface ReactionStore {
  groups: CustomGroup[];
  customs: CustomReaction[];
  addGroup: (name: string) => void;
  renameGroup: (id: string, name: string) => void;
  /** Deletes the group and every reaction inside it. */
  removeGroup: (id: string) => void;
  add: (reaction: Omit<CustomReaction, "id">) => void;
  update: (id: string, patch: Partial<Omit<CustomReaction, "id">>) => void;
  remove: (id: string) => void;
  /** Rearranges a reaction inside its own group. */
  move: (groupId: string, fromIndex: number, toIndex: number) => void;
  /** Moves a reaction to another group, inserting it at the given slot. */
  relocate: (id: string, groupId: string, slot: number) => void;
  /** Appends an imported preset under fresh ids, keeping what the user already has. */
  importPreset: (groups: CustomGroup[], customs: CustomReaction[]) => void;
}

export const useReactionStore = create<ReactionStore>((set) => ({
  ...load(),
  addGroup: (name) =>
    set((state) => {
      const groups = [...state.groups, { id: newId(), name }];
      persist(groups, state.customs);
      return { groups };
    }),
  renameGroup: (id, name) =>
    set((state) => {
      const groups = state.groups.map((g) => (g.id === id ? { ...g, name } : g));
      persist(groups, state.customs);
      return { groups };
    }),
  removeGroup: (id) =>
    set((state) => {
      const groups = state.groups.filter((g) => g.id !== id);
      const customs = state.customs.filter((r) => r.groupId !== id);
      persist(groups, customs);
      return { groups, customs };
    }),
  add: (reaction) =>
    set((state) => {
      const custom: CustomReaction = { ...reaction, id: newId() };
      const customs = [...state.customs, custom];
      persist(state.groups, customs);
      return { customs };
    }),
  update: (id, patch) =>
    set((state) => {
      const customs = state.customs.map((r) => (r.id === id ? { ...r, ...patch, id: r.id } : r));
      persist(state.groups, customs);
      return { customs };
    }),
  remove: (id) =>
    set((state) => {
      const customs = state.customs.filter((r) => r.id !== id);
      persist(state.groups, customs);
      return { customs };
    }),
  move: (groupId, fromIndex, toIndex) =>
    set((state) => {
      const inGroup = state.customs.filter((r) => r.groupId === groupId);
      const moved = inGroup.splice(fromIndex, 1)[0];
      if (!moved) return {};
      const to = Math.min(Math.max(toIndex, 0), inGroup.length);
      inGroup.splice(to, 0, moved);
      // Order across groups is irrelevant (the UI filters per group), so the
      // sorted group can simply land at the back of the flat array.
      const customs = [...state.customs.filter((r) => r.groupId !== groupId), ...inGroup];
      persist(state.groups, customs);
      return { customs };
    }),
  relocate: (id, groupId, slot) =>
    set((state) => {
      const reaction = state.customs.find((r) => r.id === id);
      if (!reaction || !state.groups.some((g) => g.id === groupId)) return {};
      const target = state.customs.filter((r) => r.groupId === groupId && r.id !== id);
      const to = Math.min(Math.max(slot, 0), target.length);
      target.splice(to, 0, { ...reaction, groupId });
      // Order across groups is irrelevant (the UI filters per group), so the
      // target group can simply land at the back of the flat array.
      const customs = [
        ...state.customs.filter((r) => r.id !== id && r.groupId !== groupId),
        ...target,
      ];
      persist(state.groups, customs);
      return { customs };
    }),
  importPreset: (presetGroups, presetCustoms) =>
    set((state) => {
      if (presetGroups.length === 0) return {};
      // Fresh ids avoid clashing with reactions already on this device.
      const idMap = new Map(presetGroups.map((g) => [g.id, newId()]));
      const groups = [
        ...state.groups,
        ...presetGroups.map((g) => ({ id: idMap.get(g.id)!, name: g.name })),
      ];
      const customs = [
        ...state.customs,
        ...presetCustoms
          .filter((r) => idMap.has(r.groupId))
          .map((r) => ({ ...r, id: newId(), groupId: idMap.get(r.groupId)! })),
      ];
      persist(groups, customs);
      return { groups, customs };
    }),
}));
