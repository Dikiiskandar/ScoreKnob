import { useState } from "react";
import { usePwaInstall } from "./usePwaInstall";

/**
 * Shared install-button behaviour for the scoreboard pages: prompt natively
 * when possible, otherwise open the manual iOS instructions sheet.
 */
export const useInstallAction = () => {
  const { canInstall, needsIosInstructions, isInstalled, isOffline, promptInstall } = usePwaInstall();
  const [showIosInstall, setShowIosInstall] = useState(false);

  const showInstallAction = !isInstalled && (canInstall || needsIosInstructions);

  const handleInstall = () => {
    if (canInstall) {
      void promptInstall();
      return;
    }
    setShowIosInstall(true);
  };

  return {
    showInstallAction,
    showIosInstall,
    handleInstall,
    closeIosInstall: () => setShowIosInstall(false),
    isOffline,
  };
};
