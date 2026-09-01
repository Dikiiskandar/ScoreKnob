import { useEffect, useRef, useState } from "react";
import { fileToDataUrl } from "@/lib/file";

/** Clips are kept short so they fit comfortably in localStorage. */
export const MAX_VOICE_MS = 5000;

/**
 * The microphone APIs only exist in a secure context, so plain-http origins
 * (e.g. a dev server reached over the LAN by IP) cannot record at all.
 */
export const canRecordVoice = () =>
  typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

export const recordUnavailableReason = () =>
  window.isSecureContext
    ? "This browser has no microphone recording support."
    : "Recording needs a secure page: open the app over https (or on localhost).";

/**
 * Records a short microphone clip and hands it back as a data URL.
 * `recordingFor` holds the key passed to `start`, so callers can tell which
 * row is currently recording.
 */
export const useVoiceRecorder = () => {
  const [recordingFor, setRecordingFor] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stop = () => {
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
  };

  const start = async (key: number, onDone: (voice: string) => void) => {
    if (recorderRef.current) return;
    if (!canRecordVoice()) {
      setError(recordUnavailableReason());
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked");
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      recorderRef.current = null;
      clearTimers();
      setRecordingFor(null);
      setElapsedMs(0);
      if (chunks.length === 0) return;
      try {
        onDone(await fileToDataUrl(new Blob(chunks, { type: recorder.mimeType })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save that recording");
      }
    };

    recorderRef.current = recorder;
    setError("");
    setRecordingFor(key);
    setElapsedMs(0);
    recorder.start();

    const startedAt = Date.now();
    intervalRef.current = window.setInterval(() => {
      setElapsedMs(Math.min(Date.now() - startedAt, MAX_VOICE_MS));
    }, 100);
    timeoutRef.current = window.setTimeout(stop, MAX_VOICE_MS);
  };

  useEffect(() => () => {
    clearTimers();
    stop();
  }, []);

  return { recordingFor, elapsedMs, error, start, stop };
};
