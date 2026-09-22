import type { CustomGroup, CustomReaction } from "@/store/useReactionStore";

/**
 * A reaction preset is every custom group plus the reactions inside them,
 * serialized as one JSON document. Sounds are already data URLs, so the file
 * is fully self-contained for sharing between devices.
 */
const KIND = "scoreknob-reaction-preset";

/** Import is capped well above the per-sound limit so typical presets fit. */
export const MAX_PRESET_BYTES = 10 * 1024 * 1024;

export type ReactionPreset = {
  groups: CustomGroup[];
  customs: CustomReaction[];
};

export const buildPreset = (groups: CustomGroup[], customs: CustomReaction[]): string =>
  JSON.stringify({ kind: KIND, version: 1, groups, customs }, null, 2);

export const parsePreset = (text: string): ReactionPreset => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON");
  }

  const preset = data as Partial<{ kind: unknown; groups: unknown; customs: unknown }>;
  if (preset?.kind !== KIND) throw new Error("That file is not a ScoreKnob reaction preset");

  const groups = Array.isArray(preset.groups)
    ? preset.groups.filter(
        (g): g is CustomGroup =>
          !!g && typeof g.id === "string" && typeof g.name === "string",
      )
    : [];

  const customs = Array.isArray(preset.customs)
    ? preset.customs.filter(
        (r): r is CustomReaction =>
          !!r &&
          typeof r.id === "string" &&
          typeof r.groupId === "string" &&
          typeof r.name === "string" &&
          (r.icon === undefined || typeof r.icon === "string") &&
          typeof r.sound === "string",
      )
    : [];

  if (groups.length === 0 && customs.length === 0) {
    throw new Error("That preset has no reactions to import");
  }
  return { groups, customs };
};
