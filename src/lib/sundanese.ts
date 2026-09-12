/**
 * Turns digits into Sundanese number words (hiji, dua, tilu, ...) so the
 * score announcement can be spoken in Sundanese by a fallback voice — real
 * `su` voices are almost never installed, so this leans on an Indonesian
 * voice, which shares the same pronunciation.
 */

export const SUNDANESE_LANG = "su";

const ONES = [
  "enol",
  "hiji",
  "dua",
  "tilu",
  "opat",
  "lima",
  "genep",
  "tujuh",
  "dalapan",
  "salapan",
];

/** Spells out 0–999; bigger scores are left as digits. */
export const numberWords = (n: number): string => {
  if (n < 0 || n >= 1000) return String(n);
  if (n < 10) return ONES[n];
  if (n === 10) return "sapuluh";
  if (n === 11) return "sabelas";
  if (n < 20) return `${ONES[n - 10]} belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${ONES[tens]} puluh${rest ? ` ${ONES[rest]}` : ""}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return `${hundreds === 1 ? "saratus" : `${ONES[hundreds]} ratus`}${rest ? ` ${numberWords(rest)}` : ""}`;
};

/** Replaces every run of digits in an announcement with Sundanese words. */
export const translateScore = (text: string) =>
  text.replace(/\d+/g, (digits) => numberWords(Number(digits)));

/**
 * Picks a voice for Sundanese: a real `su` voice when the device has one,
 * the closest Indonesian voice otherwise (same sounds, always available).
 */
export const pickVoice = (voices: SpeechSynthesisVoice[]) =>
  voices.find((v) => v.lang.toLowerCase().startsWith("su")) ??
  voices.find((v) => v.lang.toLowerCase().startsWith("id"));
