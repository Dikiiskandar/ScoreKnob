/** iOS only greys in files whose extension/UTI it recognises, so a bare `audio/*` blocks MP3s. */
export const AUDIO_ACCEPT = "audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,.aif,.aiff,.amr,.3gp";

export const fileToDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });

/** Triggers a download of a text payload (e.g. an exported JSON preset). */
export const downloadTextFile = (name: string, text: string, mime = "application/json") => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  // The download only starts after the click resolves, so revoke on a delay.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
