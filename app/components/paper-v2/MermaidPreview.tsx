import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

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

type ContentSize = { width: number; height: number };
type Pan = { x: number; y: number };

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function measureDisplayedSize(canvas: HTMLDivElement | null): ContentSize {
  if (!canvas) return { width: 0, height: 0 };
  const svg = canvas.querySelector("svg");
  if (!svg) return { width: 0, height: 0 };

  const rect = svg.getBoundingClientRect();
  const width = rect.width || svg.clientWidth || svg.scrollWidth;
  const height = rect.height || svg.clientHeight || svg.scrollHeight;

  if (width > 0 && height > 0) {
    return { width, height };
  }

  const viewBox = svg.viewBox?.baseVal;
  if (viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  return { width: 0, height: 0 };
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [baseSize, setBaseSize] = useState<ContentSize>({ width: 0, height: 0 });
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

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const captureBaseSize = useCallback(() => {
    requestAnimationFrame(() => {
      setBaseSize(measureDisplayedSize(ref.current));
    });
  }, []);

  useEffect(() => {
    resetView();
    setBaseSize({ width: 0, height: 0 });
  }, [source, svg, resetView]);

  useLayoutEffect(() => {
    if (!mounted || loading || !svg || !ref.current) return;
    ref.current.innerHTML = svg;
    setError(null);
    captureBaseSize();
  }, [mounted, loading, svg, captureBaseSize]);

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
        captureBaseSize();
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
  }, [mounted, source, svg, loading, captureBaseSize]);

  const zoomOut = useCallback(() => {
    setZoom((current) => {
      const next = clampZoom(Number((current - ZOOM_STEP).toFixed(2)));
      if (current !== 1 && next === 1) {
        captureBaseSize();
      }
      return next;
    });
  }, [captureBaseSize]);

  const zoomIn = useCallback(() => {
    setZoom((current) => {
      if (current === 1) {
        captureBaseSize();
      }
      return clampZoom(Number((current + ZOOM_STEP).toFixed(2)));
    });
  }, [captureBaseSize]);

  const handleReset = useCallback(() => {
    resetView();
    captureBaseSize();
  }, [captureBaseSize, resetView]);

  const displayError = externalError ?? error;
  const isDefaultView = zoom === 1 && pan.x === 0 && pan.y === 0;
  const useCanvasMode = !isDefaultView;

  const stageStyle: CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: "top left",
    width:
      useCanvasMode && baseSize.width > 0 ? baseSize.width : "100%",
  };

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setIsDragging(false);
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (loading || event.button !== 0) return;
      if (isDefaultView) {
        captureBaseSize();
      }
      event.preventDefault();
      viewportRef.current?.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      setIsDragging(true);
    },
    [captureBaseSize, isDefaultView, loading, pan.x, pan.y]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      setPan({
        x: drag.panX + (event.clientX - drag.startX),
        y: drag.panY + (event.clientY - drag.startY),
      });
    },
    []
  );

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
          onClick={handleReset}
          disabled={isDefaultView || loading}
        >
          Reset
        </button>
        <span className={classes.panHint}>Drag to pan</span>
      </div>

      {loading ? (
        <div className={classes.loading}>Repairing Mermaid syntax, then rendering…</div>
      ) : null}

      {displayError ? <div className={classes.error}>{displayError}</div> : null}

      <div
        ref={viewportRef}
        className={`${classes.viewport} ${isDragging ? classes.viewportDragging : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        role="presentation"
        aria-label="Diagram preview canvas. Drag to pan, use zoom controls to scale."
      >
        <div
          className={`${classes.stage} ${useCanvasMode ? classes.stageCanvas : classes.stageFit}`}
          style={stageStyle}
        >
          <div ref={ref} className={classes.canvas} />
        </div>
      </div>
    </div>
  );
}
