import { type EnrichedScreen } from "@/data/helpers";
import { screenshotUrl } from "./screenshot-url";

export type StripOrientation = "horizontal" | "vertical";

/**
 * Stitch multiple screen images into a single strip PNG.
 * Uses offscreen canvas — browser only.
 */
export async function createFlowStrip(
  screens: EnrichedScreen[],
  orientation: StripOrientation = "horizontal",
  gap = 16,
  maxHeight = 800
): Promise<Blob> {
  const screensWithImages = screens.filter((s) => s.image);
  if (screensWithImages.length === 0) throw new Error("No screens with images");

  // Load all images
  const images = await Promise.all(
    screensWithImages.map(
      (s) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = screenshotUrl(s.image) || s.image!;
        })
    )
  );

  // Calculate dimensions
  let canvasWidth: number;
  let canvasHeight: number;

  if (orientation === "horizontal") {
    // Scale all to same height
    const targetHeight = maxHeight;
    const scaledWidths = images.map(
      (img) => (img.naturalWidth / img.naturalHeight) * targetHeight
    );
    canvasWidth = scaledWidths.reduce((sum, w) => sum + w, 0) + gap * (images.length - 1);
    canvasHeight = targetHeight;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d")!;

    // Dark background
    ctx.fillStyle = "#0C0C0E";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let x = 0;
    for (let i = 0; i < images.length; i++) {
      const w = scaledWidths[i];
      ctx.drawImage(images[i], x, 0, w, targetHeight);
      x += w + gap;
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed"))), "image/png");
    });
  } else {
    // Vertical: scale all to same width
    const targetWidth = Math.max(...images.map((img) => img.naturalWidth));
    const scaledHeights = images.map(
      (img) => (img.naturalHeight / img.naturalWidth) * targetWidth
    );
    canvasWidth = targetWidth;
    canvasHeight = scaledHeights.reduce((sum, h) => sum + h, 0) + gap * (images.length - 1);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#0C0C0E";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let y = 0;
    for (let i = 0; i < images.length; i++) {
      const h = scaledHeights[i];
      ctx.drawImage(images[i], 0, y, targetWidth, h);
      y += h + gap;
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed"))), "image/png");
    });
  }
}

export async function downloadFlowAsStrip(
  screens: EnrichedScreen[],
  orientation: StripOrientation = "horizontal",
  filename = "flow-strip.png"
): Promise<void> {
  const blob = await createFlowStrip(screens, orientation);
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
