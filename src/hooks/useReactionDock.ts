import type { DockItem } from "@/components/FloatingDock";
import { REACTION_ICONS } from "@/lib/reactionIcons";
import { REACTION_KINDS, REACTION_LABELS, playReaction, playSound } from "@/lib/reactions";
import { useReactionStore } from "@/store/useReactionStore";

/** Built-in reactions first (read-only), then whatever the user added. */
export const useReactionDock = (): DockItem[] => {
  const customs = useReactionStore((state) => state.customs);

  return [
    ...REACTION_KINDS.map((kind) => ({
      id: kind,
      icon: REACTION_ICONS[kind],
      label: REACTION_LABELS[kind],
      onSelect: () => void playReaction(kind),
    })),
    ...customs.map((reaction) => ({
      id: `custom-${reaction.id}`,
      icon: REACTION_ICONS[reaction.icon] ?? REACTION_ICONS.music,
      label: reaction.name,
      onSelect: () => void playSound(reaction.id, reaction.sound),
    })),
  ];
};
