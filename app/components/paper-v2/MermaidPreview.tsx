import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import classes from "./mermaid-preview.module.css";
import { toMermaidExportPayload, type MermaidExportPayload } from "#app/utils/export-mermaid-png";
import { repairAndRenderMermaid } from "#app/utils/render-mermaid";

type MermaidPreviewProps = {
  source: string;
  svg?: string | null;
  loading?: boolean;
  error?: string | null;
  onSvgReady?: (payload: MermaidExportPayload) => void;
  onRepairedSource?: (repaired: string) => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function MermaidPreview({
  source,
  svg,
  loading = false,
  error: externalError = null,
  onSvgReady,
  onRepairedSource,
}: MermaidPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const onSvgReadyRef = useRef(onSvgReady);
  const onRepairedSourceRef = useRef(onRepairedSource);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onSvgReadyRef.current = onSvgReady;
  }, [onSvgReady]);

  useEffect(() => {
    onRepairedSourceRef.current = onRepairedSource;
  }, [onRepairedSource]);

  useEffect(() => {
    setZoom(1);
  }, [source, svg]);

  useLayoutEffect(() => {
    if (!mounted || loading || !svg || !ref.current) return;
    ref.current.innerHTML = svg;
    setError(null);
  }, [mounted, loading, svg]);

  useEffect(() => {
    if (!mounted || loading || svg) return;

    let cancelled = false;

    async function render() {
      if (!source.trim() || !ref.current) {
        if (ref.current) ref.current.innerHTML = "";
        setError(null);
        return;
      }

      try {
        const { svg: renderedSvg, repairedSource } =
          await repairAndRenderMermaid(source);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = renderedSvg;
        setError(null);
        onRepairedSourceRef.current?.(repairedSource);
        onSvgReadyRef.current?.(toMermaidExportPayload(renderedSvg));
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not render diagram"
          );
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [mounted, source, svg, loading]);

  const zoomOut = useCallback(() => {
    setZoom((current) => clampZoom(Number((current - ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => clampZoom(Number((current + ZOOM_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const displayError = externalError ?? error;

  if (!mounted) {
    return (
      <div className={classes.wrap}>
        <div className={classes.loading}>Preparing diagram preview…</div>
        <div className={classes.viewport}>
          <div className={classes.canvas} />
        </div>
      </div>
    );
  }

  return (
    <div className={classes.wrap}>
      <div className={classes.toolbar}>
        <span className={classes.toolbarLabel}>Zoom</span>
        <button
          type="button"
          className={classes.zoomBtn}
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM || loading}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className={classes.zoomValue}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={classes.zoomBtn}
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM || loading}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className={classes.resetBtn}
          onClick={resetZoom}
          disabled={zoom === 1 || loading}
        >
          Reset
        </button>
      </div>

      {loading ? (
        <div className={classes.loading}>Repairing Mermaid syntax, then rendering…</div>
      ) : null}

      {displayError ? <div className={classes.error}>{displayError}</div> : null}

      <div className={classes.viewport}>
        <div
          className={classes.scaledLayer}
          style={{ zoom } as CSSProperties}
        >
          <div ref={ref} className={classes.canvas} />
        </div>
      </div>
    </div>
  );
}
