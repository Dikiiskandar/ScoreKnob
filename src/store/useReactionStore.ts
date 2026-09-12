import { create } from "zustand";

export type CustomReaction = {
  id: string;
  name: string;
  /** Key into the shared icon picker map. */
  icon: string;
  /** Data URL of an audio file, kept small so localStorage copes. */
  sound: string;
};

/** Sounds live in localStorage next to voice clips, so stay small. */
export const MAX_REACTION_BYTES = 200 * 1024;

const STORAGE_KEY = "scoreKnobCustomReactions";

const load = (): CustomReaction[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "") as unknown;
    if (Array.isArray(saved)) {
      return saved.filter(
        (r): r is CustomReaction =>
          !!r && typeof r.id === "string" && typeof r.name === "string" &&
          typeof r.icon === "string" && typeof r.sound === "string",
      );
    }
  } catch {
    // No usable reactions stored yet.
  }
  return [];
};

const persist = (customs: CustomReaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
  } catch {
    // Storage is full (large clips); the new reaction is dropped with the state.
  }
};

interface ReactionStore {
  customs: CustomReaction[];
  add: (reaction: Omit<CustomReaction, "id">) => void;
  update: (id: string, patch: Partial<Omit<CustomReaction, "id">>) => void;
  remove: (id: string) => void;
}

export const useReactionStore = create<ReactionStore>((set) => ({
  customs: load(),
  add: (reaction) =>
    set((state) => {
      const custom: CustomReaction = {
        ...reaction,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      const customs = [...state.customs, custom];
      persist(customs);
      return { customs };
    }),
  update: (id, patch) =>
    set((state) => {
      const customs = state.customs.map((r) => (r.id === id ? { ...r, ...patch } : r));
      persist(customs);
      return { customs };
    }),
  remove: (id) =>
    set((state) => {
      const customs = state.customs.filter((r) => r.id !== id);
      persist(customs);
      return { customs };
    }),
}));
