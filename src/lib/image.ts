import { fileToDataUrl } from "@/lib/file";

const PHOTO_SIZE = 128;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image"));
    image.src = src;
  });

/**
 * Center-crops an image file to a small square data URL so player photos stay
 * well inside the localStorage quota.
 */
export const fileToSquareDataUrl = async (file: File, size: number = PHOTO_SIZE): Promise<string> => {
  const image = await loadImage(await fileToDataUrl(file));
  const side = Math.min(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported on this device");

  ctx.drawImage(
    image,
    (image.width - side) / 2,
    (image.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  );

  return canvas.toDataURL("image/jpeg", 0.8);
};
