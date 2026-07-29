const DEFAULT_MAX_LONG_EDGE = 2400;
const EMBED_MAX_LONG_EDGE = 1200;
const EXPORT_SCALE = 3;
const MAX_CANVAS_EDGE = 4096;

type RenderOptions = {
  maxLongEdge?: number;
};

function parseSvgLength(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getSvgDimensions(svgMarkup: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
  const svg = doc.documentElement;
  const viewBox = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);

  if (viewBox && viewBox.length === 4 && viewBox.every((n) => Number.isFinite(n))) {
    return { width: viewBox[2], height: viewBox[3] };
  }

  return {
    width: parseSvgLength(svg.getAttribute("width"), 800),
    height: parseSvgLength(svg.getAttribute("height"), 600),
  };
}

function exportScaleForDimensions(
  width: number,
  height: number,
  maxLongEdge: number
): number {
  const longest = Math.max(width, height, 1);
  const targetScale = Math.max(1, maxLongEdge / longest);
  const scale = Math.min(EXPORT_SCALE, targetScale);
  const maxScaleX = MAX_CANVAS_EDGE / width;
  const maxScaleY = MAX_CANVAS_EDGE / height;

  return Math.max(1, Math.min(scale, maxScaleX, maxScaleY));
}

function svgToDataUri(svgMarkup: string): string {
  const encoded = btoa(unescape(encodeURIComponent(svgMarkup)));
  return `data:image/svg+xml;base64,${encoded}`;
}

async function loadSvgImage(svgMarkup: string): Promise<HTMLImageElement> {
  const sources = [
    svgToDataUri(svgMarkup),
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`,
  ];

  let lastError: unknown = null;

  for (const src of sources) {
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load SVG for PNG export"));
        image.src = src;
      });
    } catch (error) {
      lastError = error;
    }
  }

  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load SVG for PNG export"));
      image.src = objectUrl;
    });
  } catch (error) {
    lastError = error;
    throw lastError instanceof Error
      ? lastError
      : new Error("Could not load SVG for PNG export");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function renderSvgToCanvas(
  svgMarkup: string,
  options: RenderOptions = {}
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const maxLongEdge = options.maxLongEdge ?? DEFAULT_MAX_LONG_EDGE;
  const { width, height } = getSvgDimensions(svgMarkup);
  const scale = exportScaleForDimensions(width, height, maxLongEdge);
  const canvasWidth = Math.max(1, Math.round(width * scale));
  const canvasHeight = Math.max(1, Math.round(height * scale));

  const image = await loadSvgImage(svgMarkup);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas not supported");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

  return { canvas, width: canvasWidth, height: canvasHeight };
}

async function canvasToPngDataUri(canvas: HTMLCanvasElement): Promise<string> {
  const dataUri = canvas.toDataURL("image/png");
  if (dataUri.startsWith("data:image/png")) {
    return dataUri;
  }

  const pngBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!pngBlob) {
    throw new Error("Could not create PNG data URI");
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/png")) {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not create PNG data URI"));
    };
    reader.onerror = () => reject(new Error("Could not create PNG data URI"));
    reader.readAsDataURL(pngBlob);
  });
}

/** PNG data URI for server-side storage (DOCX/PDF embed). */
export async function toMermaidPngDataUri(
  svgMarkup: string,
  options: RenderOptions = {}
): Promise<string> {
  const { canvas } = await renderSvgToCanvas(svgMarkup, {
    maxLongEdge: options.maxLongEdge ?? EMBED_MAX_LONG_EDGE,
  });
  return canvasToPngDataUri(canvas);
}

export async function downloadHighResMermaidPng(
  svgMarkup: string,
  filename = "framework-diagram.png"
): Promise<void> {
  const { canvas } = await renderSvgToCanvas(svgMarkup, {
    maxLongEdge: DEFAULT_MAX_LONG_EDGE,
  });

  const pngBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!pngBlob) {
    throw new Error("Could not create PNG");
  }

  const downloadUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

export function downloadMermaidSvg(
  svgMarkup: string,
  filename = "framework-diagram.svg"
): void {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type MermaidExportPayload = {
  dataUri: string;
  svg: string;
};

export function toMermaidExportPayload(svg: string): MermaidExportPayload {
  return {
    svg,
    dataUri: svgToDataUri(svg),
  };
}
