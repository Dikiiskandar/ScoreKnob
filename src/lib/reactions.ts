/**
 * Shared Web Audio plumbing for reaction sounds. Built-in clips are fetched
 * from `public/sounds`; custom ones come from data URLs. Everything decodes
 * through one AudioContext, and new playback interrupts the current clip.
 */

export type Reaction = "applause" | "laugh" | "sad";

const CLIPS: Record<Reaction, string> = {
  applause: "sounds/applause.mp3",
  laugh: "sounds/laugh.mp3",
  sad: "sounds/sad.mp3",
};

export const REACTION_KINDS = Object.keys(CLIPS) as Reaction[];

export const REACTION_LABELS: Record<Reaction, string> = {
  applause: "Applause",
  laugh: "Laugh",
  sad: "Sad",
};

let ctx: AudioContext | null = null;
const downloads = new Map<string, Promise<ArrayBuffer>>();
const decoded = new Map<string, AudioBuffer>();
let playing: AudioBufferSourceNode | null = null;

/**
 * Creates the context on demand and resumes it. iOS only honours `resume()`
 * inside a user gesture, so never call this from an effect or a timer.
 */
const audio = () => {
  if (!ctx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
  }
  void ctx.resume();
  return ctx;
};

const download = (key: string, url: string) => {
  const cached = downloads.get(key);
  if (cached) return cached;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${url} responded ${response.status}`);
      return response.arrayBuffer();
    })
    .catch((error: unknown) => {
      // Allow a later tap to retry, e.g. after the network comes back.
      downloads.delete(key);
      throw error;
    });

  downloads.set(key, request);
  return request;
};

const decode = async (context: AudioContext, key: string, url: string) => {
  const cached = decoded.get(key);
  if (cached) return cached;

  // decodeAudioData detaches the buffer it is given, so decode a copy.
  const bytes = await download(key, url);
  const buffer = await context.decodeAudioData(bytes.slice(0));
  decoded.set(key, buffer);
  return buffer;
};

/** Plays one clip, interrupting whatever is currently sounding. */
const play = async (key: string, url: string, warn: string) => {
  // Touch the context first so the gesture that triggered this unlocks audio.
  const context = audio();

  try {
    const buffer = await decode(context, key, url);

    try {
      playing?.stop();
    } catch {
      // The previous source already finished on its own.
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      if (playing === source) playing = null;
    };
    source.start();
    playing = source;
  } catch (error) {
    console.warn(warn, error);
  }
};

/** Absolute URL of a built-in clip, for reusing it outside the dock (e.g. as a player voice). */
export const reactionUrl = (reaction: Reaction) => `${import.meta.env.BASE_URL}${CLIPS[reaction]}`;

/** Fetches the built-in clips ahead of time; decoding waits for the first tap. */
export const preloadReactions = () => {
  REACTION_KINDS.forEach((reaction) =>
    void download(reaction, reactionUrl(reaction)).catch((error: unknown) =>
      console.warn(`Could not fetch the ${reaction} clip`, error),
    ),
  );
};

export const playReaction = async (reaction: Reaction) =>
  play(reaction, reactionUrl(reaction), `Could not play the ${reaction} reaction`);

/** Plays a user-chosen clip, e.g. a data URL; the key keeps one decode cache per reaction. */
export const playSound = (key: string, url: string) =>
  play(`custom:${key}`, url, "Could not play the custom reaction");
