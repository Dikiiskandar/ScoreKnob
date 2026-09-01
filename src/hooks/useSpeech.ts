import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'scoreKnobSpeech';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Announces short phrases with the device voice, remembering whether the user
 * wants them. Browsers only allow speech after a user gesture, so call `speak`
 * from an event handler rather than an effect.
 */
export function useSpeech() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === 'on');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    if (!enabled && canSpeak()) speechSynthesis.cancel();
  }, [enabled]);

  /** `force` speaks even while disabled, for the tap that turns announcements on. */
  const speak = useCallback(
    (text: string, force = false) => {
      if ((!enabled && !force) || !canSpeak()) return;
      // Drop any queued announcement so fast tapping always says the latest score.
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    },
    [enabled],
  );

  return { enabled, setEnabled, speak, supported: canSpeak() };
}
