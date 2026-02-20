import { type EnrichedScreen } from "@/data/helpers";
import { screenshotUrl } from "./screenshot-url";

/**
 * Figma-compatible JSON export format.
 * Generates a frame structure that can be imported via Figma REST API
 * or used as structured reference data.
 */

export interface FigmaFrame {
  type: "FRAME";
  name: string;
  width: number;
  height: number;
  children: FigmaNode[];
  metadata: {
    app: string;
    flow: string;
    exportedAt: string;
    source: string;
  };
}

export interface FigmaNode {
  type: "RECTANGLE" | "TEXT" | "FRAME";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: FigmaFill[];
  characters?: string;
}

export interface FigmaFill {
  type: "IMAGE" | "SOLID";
  imageUrl?: string;
  color?: { r: number; g: number; b: number; a: number };
}

const SCREEN_WIDTH = 1440;
const SCREEN_HEIGHT = 900;
const GAP = 40;
const LABEL_HEIGHT = 40;

export function generateFigmaJSON(screens: EnrichedScreen[]): FigmaFrame {
  const screensWithImages = screens.filter((s) => s.image);
  const totalWidth = screensWithImages.length * (SCREEN_WIDTH + GAP) - GAP;

  const children: FigmaNode[] = [];

  screensWithImages.forEach((screen, i) => {
    const x = i * (SCREEN_WIDTH + GAP);

    // Screen image frame
    children.push({
      type: "RECTANGLE",
      name: `${screen.appName} — ${screen.label}`,
      x,
      y: LABEL_HEIGHT,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      fills: [
        {
          type: "IMAGE",
          imageUrl: screenshotUrl(screen.image) || screen.image!,
        },
      ],
    });

    // Label text
    children.push({
      type: "TEXT",
      name: `Label — Step ${screen.step}`,
      x,
      y: 0,
      width: SCREEN_WIDTH,
      height: LABEL_HEIGHT,
      characters: `${screen.appName} · ${screen.flow} · Step ${screen.step} · ${screen.label}`,
    });
  });

  return {
    type: "FRAME",
    name: `${screens[0]?.appName || "Export"} — ${screens[0]?.flow || "Flow"} Flow`,
    width: totalWidth,
    height: SCREEN_HEIGHT + LABEL_HEIGHT,
    children,
    metadata: {
      app: screens[0]?.appSlug || "",
      flow: screens[0]?.flow || "",
      exportedAt: new Date().toISOString(),
      source: "Darkscreens",
    },
  };
}

export function downloadFigmaJSON(
  screens: EnrichedScreen[],
  filename = "flow-figma.json"
): void {
  const json = generateFigmaJSON(screens);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadMetadataJSON(
  screens: EnrichedScreen[],
  filename = "screens-metadata.json"
): void {
  const metadata = screens.map((s) => ({
    app: s.appSlug,
    appName: s.appName,
    category: s.appCategory,
    flow: s.flow,
    step: s.step,
    label: s.label,
    tags: s.tags || [],
    image: screenshotUrl(s.image) || s.image,
    layer: s.layer || "Product",
  }));
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
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
