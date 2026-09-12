import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Backdrop + panel shell shared by every dialog in the app.
 * `variant="center"` is a floating dialog; `variant="bottom"` becomes a
 * bottom sheet on phones and a floating dialog on larger screens.
 */
const Modal: React.FC<{
  onClose?: () => void;
  variant?: "center" | "bottom";
  maxWidth?: string;
  /** Extra classes for the panel itself (padding, height, layout, ...). */
  className?: string;
  /** Extra classes for the backdrop, e.g. a higher z-index for stacked sheets. */
  backdropClassName?: string;
  children: React.ReactNode;
}> = ({ onClose, variant = "center", maxWidth = "max-w-md", className, backdropClassName, children }) => (
  <div
    onClick={() => onClose?.()}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 flex p-4",
      variant === "center"
        ? "items-center justify-center pt-[calc(1rem+var(--safe-top))]"
        : "items-end justify-center pb-[calc(1rem+var(--safe-bottom))] sm:items-center sm:pb-4",
      backdropClassName,
    )}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn("w-full bg-card border rounded-2xl shadow-2xl overflow-hidden", maxWidth, className)}
    >
      {children}
    </div>
  </div>
);

/** Title block used at the top of bottom sheets. */
export const SheetHeader: React.FC<{ title: React.ReactNode; description?: React.ReactNode }> = ({
  title,
  description,
}) => (
  <div className="px-4 py-3 border-b">
    <div className="font-semibold">{title}</div>
    {description && <div className="text-xs text-muted-foreground">{description}</div>}
  </div>
);

/** Full-width tappable row used inside bottom sheets. */
export const SheetRow: React.FC<
  React.ComponentProps<"button"> & { danger?: boolean; active?: boolean }
> = ({ className, danger, active, type = "button", ...props }) => (
  <button
    type={type}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 border-t transition-colors",
      danger
        ? "text-red-600 hover:bg-red-600/10"
        : active
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "hover:bg-accent",
      className,
    )}
    {...props}
  />
);

/** Muted secondary action filling the width of a dialog. */
export const SheetSecondaryAction: React.FC<React.ComponentProps<"button">> = ({
  className,
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={cn(
      "w-full px-4 py-3 bg-muted text-foreground rounded-md hover:bg-accent transition-colors",
      className,
    )}
    {...props}
  />
);

export default Modal;
