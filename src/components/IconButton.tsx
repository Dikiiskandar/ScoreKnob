import * as React from "react";
import { cn } from "@/lib/utils";

export type IconButtonProps = React.ComponentProps<"button"> & {
  /** Highlighted state, e.g. a toggle that is currently on. */
  active?: boolean;
  danger?: boolean;
  /** Fully round shape (default is slightly rounded). */
  round?: boolean;
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, active, danger, round, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "size-10 shrink-0 inline-flex items-center justify-center transition-all active:scale-95",
        round ? "rounded-full" : "rounded-lg",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : active
            ? "text-primary bg-primary/10 hover:bg-primary/20"
            : "text-muted-foreground hover:bg-accent",
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

export default IconButton;
