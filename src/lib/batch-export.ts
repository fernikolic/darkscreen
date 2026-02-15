import { type EnrichedScreen } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";

/**
 * Download multiple screenshots as a ZIP file.
 * Uses JSZip (dynamically imported to avoid bloating initial bundle).
 */
export async function downloadScreensAsZip(
  screens: EnrichedScreen[],
  filename = "darkscreen-export.zip"
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const folder = zip.folder("screenshots");
  if (!folder) throw new Error("Failed to create ZIP folder");

  // Fetch all images in parallel
  const fetches = screens.map(async (screen) => {
    if (!screen.image) return;
    const url = screenshotUrl(screen.image);
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const blob = await response.blob();
      const name = `${screen.appSlug}-${screen.flow}-step${screen.step}.png`;
      folder.file(name, blob);
    } catch {
      // skip failed downloads
    }
  });

  await Promise.all(fetches);

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, filename);
}

/**
 * Copy a single image to clipboard (browser limitation: one at a time).
 */
export async function copyScreenToClipboard(imageUrl: string): Promise<void> {
  const { copyImageToClipboard } = await import("@/lib/clipboard");
  await copyImageToClipboard(imageUrl);
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
