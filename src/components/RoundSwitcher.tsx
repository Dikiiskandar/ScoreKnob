import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating round selector shared by the Knob and Versus pages.
 * `position="fixed"` pins it to the viewport; `position="absolute"` anchors it
 * inside a relative parent that owns the safe-area.
 */
const RoundSwitcher: React.FC<{
  count: number;
  current: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  position?: "fixed" | "absolute";
  maxWidth?: string;
}> = ({ count, current, onSelect, onAdd, position = "fixed", maxWidth = "max-w-[calc(100vw-170px)]" }) => (
  <div
    className={cn(
      position === "fixed" ? "fixed bottom-4" : "absolute bottom-[calc(1rem+var(--safe-bottom))]",
      "left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 overflow-x-auto rounded-full bg-card/90 border px-3 py-2 shadow-2xl backdrop-blur-md",
      maxWidth,
    )}
  >
    {Array.from({ length: count }, (_, index) => (
      <button
        key={index}
        onClick={() => onSelect(index)}
        aria-label={`Round ${index + 1}`}
        aria-current={current === index}
        className={cn(
          "size-10 flex-shrink-0 rounded-full text-sm font-bold transition-all active:scale-95",
          current === index
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground hover:bg-accent",
        )}
      >
        {index + 1}
      </button>
    ))}
    <button
      onClick={onAdd}
      aria-label="Add round"
      className="size-10 flex-shrink-0 rounded-full bg-muted text-foreground hover:bg-accent active:scale-95 transition-all flex items-center justify-center"
    >
      <Plus className="w-5 h-5" />
    </button>
  </div>
);

export default RoundSwitcher;
