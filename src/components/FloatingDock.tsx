import React, { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type DockItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
};

const SIZE = 56;
const MARGIN = 12;
/** Below this movement a pointer sequence counts as a tap, not a drag. */
const DRAG_THRESHOLD = 6;

type Placement = {
  side: "left" | "right";
  /** Vertical position as a fraction of the viewport, so rotating keeps it in place. */
  y: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const loadPlacement = (storageKey: string): Placement => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "") as Placement;
    if (saved.side === "left" || saved.side === "right") {
      return { side: saved.side, y: clamp(saved.y, 0, 1) };
    }
  } catch {
    // No usable placement stored yet.
  }
  return { side: "right", y: 0.5 };
};

/**
 * An iOS AssistiveTouch style button: drag it anywhere, it snaps to the nearest
 * edge, and tapping it reveals the actions.
 */
const FloatingDock: React.FC<{
  items: DockItem[];
  icon: LucideIcon;
  label: string;
  storageKey: string;
}> = ({ items, icon: Icon, label, storageKey }) => {
  const [placement, setPlacement] = useState(() => loadPlacement(storageKey));
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  /** Live pixel position while a drag is in progress. */
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const gesture = useRef<{ x: number; y: number; originX: number; originY: number; moved: boolean } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(placement));
  }, [placement, storageKey]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onOutside);
    return () => window.removeEventListener("pointerdown", onOutside);
  }, [open]);

  const maxY = Math.max(viewport.height - SIZE - MARGIN, MARGIN);
  const resting = {
    x: placement.side === "left" ? MARGIN : Math.max(viewport.width - SIZE - MARGIN, MARGIN),
    y: clamp(placement.y * viewport.height - SIZE / 2, MARGIN, maxY),
  };
  const position = drag ?? resting;

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    start.moved = true;
    setOpen(false);
    setDrag({
      x: clamp(start.originX + dx, MARGIN, Math.max(viewport.width - SIZE - MARGIN, MARGIN)),
      y: clamp(start.originY + dy, MARGIN, maxY),
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start) return;

    if (!start.moved) {
      setOpen((wasOpen) => !wasOpen);
      return;
    }

    const centerX = clamp(start.originX + (event.clientX - start.x), MARGIN, viewport.width) + SIZE / 2;
    const centerY = clamp(start.originY + (event.clientY - start.y), MARGIN, maxY) + SIZE / 2;
    setPlacement({
      side: centerX < viewport.width / 2 ? "left" : "right",
      y: centerY / viewport.height,
    });
    setDrag(null);
  };

  return (
    <div
      ref={root}
      className="fixed z-40"
      style={{
        left: position.x,
        top: position.y,
        width: SIZE,
        height: SIZE,
        transition: drag ? "none" : "left 200ms ease-out, top 200ms ease-out",
      }}
    >
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          gesture.current = null;
          setDrag(null);
        }}
        aria-label={label}
        aria-expanded={open}
        // Stops the browser from scrolling or long-press-selecting mid-drag.
        style={{ touchAction: "none" }}
        className={`w-full h-full rounded-full bg-card/80 shadow-2xl backdrop-blur-md flex items-center justify-center transition-opacity ${
          open || drag ? "opacity-100" : "opacity-60 hover:opacity-100"
        }`}
      >
        <Icon className="w-6 h-6 text-foreground" />
      </button>

      {open && (
        <div
          className={`absolute top-0 flex items-center gap-2 rounded-full bg-card/90 p-2 shadow-2xl backdrop-blur-md ${
            placement.side === "left" ? "left-[calc(100%+0.5rem)]" : "right-[calc(100%+0.5rem)]"
          }`}
        >
          {items.map(({ id, icon: ItemIcon, label: itemLabel, onSelect }) => (
            <button
              key={id}
              onClick={() => {
                onSelect();
                setOpen(false);
              }}
              aria-label={itemLabel}
              title={itemLabel}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-muted text-foreground hover:bg-accent active:scale-95 transition-all flex items-center justify-center"
            >
              <ItemIcon className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FloatingDock;
