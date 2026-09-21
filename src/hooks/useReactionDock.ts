import type { DockGroup } from "@/components/FloatingDock";
import { REACTION_ICONS } from "@/lib/reactionIcons";
import { REACTION_KINDS, REACTION_LABELS, playReaction, playSound } from "@/lib/reactions";
import { DEFAULT_GROUP_ID, useReactionStore } from "@/store/useReactionStore";

/** The read-only built-in group first, then the user's groups in order. */
export const useReactionDock = (): DockGroup[] => {
  const customs = useReactionStore((state) => state.customs);
  const groups = useReactionStore((state) => state.groups);

  return [
    {
      id: DEFAULT_GROUP_ID,
      name: "Default",
      items: REACTION_KINDS.map((kind) => ({
        id: kind,
        icon: REACTION_ICONS[kind],
        label: REACTION_LABELS[kind],
        onSelect: () => void playReaction(kind),
      })),
    },
    ...groups.map((group) => ({
      id: group.id,
      name: group.name,
      items: customs
        .filter((reaction) => reaction.groupId === group.id)
        .map((reaction) => ({
          id: `custom-${reaction.id}`,
          icon: reaction.icon ? REACTION_ICONS[reaction.icon] : undefined,
          label: reaction.name,
          onSelect: () => void playSound(reaction.id, reaction.sound),
        })),
    })),
  ];
};
