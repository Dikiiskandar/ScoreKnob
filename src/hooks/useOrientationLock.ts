import { useEffect } from 'react';

/** The DOM lib shipped with our TypeScript version has no orientation lock types yet. */
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: OrientationLock) => Promise<void>;
  unlock?: () => void;
};

export type OrientationLock =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

/**
 * Asks the device to hold one orientation while the page is mounted.
 *
 * The Screen Orientation API only applies in fullscreen/standalone (Android);
 * iOS Safari rejects the request, so callers that truly need an orientation
 * should also render a fallback prompt.
 */
export function useOrientationLock(lockTo: OrientationLock) {
  useEffect(() => {
    const orientation = screen.orientation as LockableOrientation | undefined;
    void orientation?.lock?.(lockTo).catch(() => undefined);
    return () => orientation?.unlock?.();
  }, [lockTo]);
}
