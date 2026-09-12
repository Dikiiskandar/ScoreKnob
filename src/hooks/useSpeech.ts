import { useCallback, useEffect, useMemo, useState } from 'react';
import { SUNDANESE_LANG, pickVoice, translateScore } from '@/lib/sundanese';

const STORAGE_KEY = 'scoreKnobSpeech';
const LANG_KEY = 'scoreKnobSpeechLang';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Announces short phrases with the device voice, remembering whether the user
 * wants them and which language to use. Browsers only allow speech after a
 * user gesture, so call `speak` from an event handler rather than an effect.
 */
export function useSpeech() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === 'on');
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'auto');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    if (!enabled && canSpeak()) speechSynthesis.cancel();
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    if (!canSpeak()) return;
    const loadVoices = () => setVoices(speechSynthesis.getVoices());
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const languages = useMemo(() => {
    const unique = new Set<string>();
    voices.forEach((voice) => unique.add(voice.lang));
    // No device ships a Sundanese voice, so offer it unconditionally.
    unique.add(SUNDANESE_LANG);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [voices]);

  /** `force` speaks even while disabled, for the tap that turns announcements on. */
  const speak = useCallback(
    (text: string, force = false) => {
      if ((!enabled && !force) || !canSpeak()) return;
      // Drop any queued announcement so fast tapping always says the latest score.
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === SUNDANESE_LANG) {
        utterance.text = translateScore(text);
        const voice = pickVoice(voices);
        utterance.lang = voice ? voice.lang : SUNDANESE_LANG;
        if (voice) utterance.voice = voice;
      } else if (lang !== 'auto') {
        utterance.lang = lang;
        const voice = voices.find((v) => v.lang === lang);
        if (voice) utterance.voice = voice;
      }
      speechSynthesis.speak(utterance);
    },
    [enabled, lang, voices],
  );

  return { enabled, setEnabled, speak, supported: canSpeak(), languages, lang, setLang };
}
