import {
  Bell,
  Frown,
  Hand,
  Heart,
  Laugh,
  Music,
  PartyPopper,
  Star,
  ThumbsUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Icons a reaction can show in the dock. The first three keys match the
 * built-in reactions so their look is identical to what the pages used before.
 */
export const REACTION_ICONS: Record<string, LucideIcon> = {
  applause: Hand,
  laugh: Laugh,
  sad: Frown,
  bell: Bell,
  heart: Heart,
  music: Music,
  party: PartyPopper,
  star: Star,
  thumbsUp: ThumbsUp,
  zap: Zap,
};
