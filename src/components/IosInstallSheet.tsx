import { Plus, Share } from "lucide-react";
import Modal, { SheetSecondaryAction } from "./Modal";

/** iOS Safari has no install prompt API, so show manual instructions instead. */
const IosInstallSheet: React.FC<{ appName?: string; onClose: () => void }> = ({
  appName = "ScoreKnob",
  onClose,
}) => (
  <Modal onClose={onClose} className="p-6 space-y-4">
    <h2 className="text-xl font-bold">Add to Home Screen</h2>
    <p className="text-sm text-muted-foreground">
      Install {appName} to play offline with a full-screen app icon.
    </p>
    <ol className="space-y-3 text-sm">
      <li className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs">1</span>
        <span className="flex items-center gap-1">
          Tap the <Share className="w-4 h-4 inline" /> Share button in Safari
        </span>
      </li>
      <li className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs">2</span>
        <span className="flex items-center gap-1">
          Choose <Plus className="w-4 h-4 inline" /> Add to Home Screen
        </span>
      </li>
      <li className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs">3</span>
        <span>Tap Add to confirm</span>
      </li>
    </ol>
    <SheetSecondaryAction onClick={onClose}>Close</SheetSecondaryAction>
  </Modal>
);

export default IosInstallSheet;
