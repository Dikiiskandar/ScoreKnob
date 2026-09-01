/** Crowd reaction clips from `public/sounds`, decoded once and replayed on tap. */

export type Reaction = "applause" | "laugh" | "sad";

const CLIPS: Record<Reaction, string> = {
  applause: "sounds/applause.mp3",
  laugh: "sounds/laugh.mp3",
  sad: "sounds/sad.mp3",
};

export const REACTION_KINDS = Object.keys(CLIPS) as Reaction[];

let ctx: AudioContext | null = null;
const downloads = new Map<Reaction, Promise<ArrayBuffer>>();
const decoded = new Map<Reaction, AudioBuffer>();
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

const download = (reaction: Reaction) => {
  const cached = downloads.get(reaction);
  if (cached) return cached;

  const url = `${import.meta.env.BASE_URL}${CLIPS[reaction]}`;
  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${url} responded ${response.status}`);
      return response.arrayBuffer();
    })
    .catch((error: unknown) => {
      // Allow a later tap to retry, e.g. after the network comes back.
      downloads.delete(reaction);
      throw error;
    });

  downloads.set(reaction, request);
  return request;
};

/** Fetches the clips ahead of time; decoding waits for the first tap. */
export const preloadReactions = () => {
  REACTION_KINDS.forEach((reaction) =>
    void download(reaction).catch((error: unknown) =>
      console.warn(`Could not fetch the ${reaction} clip`, error),
    ),
  );
};

export const playReaction = async (reaction: Reaction) => {
  // Touch the context first so the gesture that triggered this unlocks audio.
  const context = audio();

  try {
    let buffer = decoded.get(reaction);
    if (!buffer) {
      // decodeAudioData detaches the buffer it is given, so decode a copy.
      const bytes = await download(reaction);
      buffer = await context.decodeAudioData(bytes.slice(0));
      decoded.set(reaction, buffer);
    }

    // One reaction at a time, so tapping again interrupts instead of piling up.
    playing?.stop();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      if (playing === source) playing = null;
    };
    source.start();
    playing = source;
  } catch (error) {
    console.warn(`Could not play the ${reaction} reaction`, error);
  }
};
