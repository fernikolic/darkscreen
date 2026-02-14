const CDN = process.env.NEXT_PUBLIC_SCREENSHOT_CDN || "";

export function screenshotUrl(path: string | undefined): string | undefined {
  if (!path || !CDN || path.startsWith("http")) return path;
  return `${CDN}${path}`;
}
