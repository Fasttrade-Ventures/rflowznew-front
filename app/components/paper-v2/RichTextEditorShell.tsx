import { Textarea, type TextareaProps } from "@mantine/core";
import { useCallback, useRef, useState } from "react";

import classes from "./rich-text-editor-shell.module.css";

type RichTextEditorShellProps = {
  value: string;
  onChange: (value: string) => void;
  active?: boolean;
  hint?: string;
  minRows?: number;
  variant?: "default" | "code";
  resizable?: boolean;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  toolbarLabel?: string;
  onFocus?: () => void;
  onBlur?: () => void;
} & Pick<TextareaProps, "placeholder" | "disabled" | "error" | "autosize">;

export function RichTextEditorShell({
  value,
  onChange,
  active = false,
  hint,
  minRows = 4,
  variant = "default",
  resizable = false,
  initialHeight = 180,
  minHeight = 120,
  maxHeight = 720,
  toolbarLabel,
  placeholder,
  disabled,
  error,
  autosize = true,
  onFocus,
  onBlur,
}: RichTextEditorShellProps) {
  const [height, setHeight] = useState(initialHeight);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const clampHeight = useCallback(
    (next: number) => Math.min(maxHeight, Math.max(minHeight, next)),
    [maxHeight, minHeight]
  );

  const onResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = { startY: event.clientY, startHeight: height };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [height]
  );

  const onResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const delta = event.clientY - dragRef.current.startY;
      setHeight(clampHeight(dragRef.current.startHeight + delta));
    },
    [clampHeight]
  );

  const onResizePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    []
  );

  const shellClass = [
    classes.shell,
    active ? classes.shellActive : "",
    variant === "code" ? classes.shellCode : "",
    resizable ? classes.shellResizable : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={shellClass}
      style={resizable ? { height, minHeight } : undefined}
    >
      <div className={classes.toolbar}>
        {variant === "code" ? (
          <>
            <span className={classes.toolbarCodeLabel}>Mermaid</span>
            <span className={classes.toolbarHint}>
              {toolbarLabel ?? "Editable source"}
            </span>
          </>
        ) : (
          <>
            <span className={classes.toolbarStrong}>B</span>
            <span className={classes.toolbarItalic}>I</span>
            <span>U</span>
            <span>·</span>
            <span className={classes.toolbarLink}>Link</span>
            <span className={classes.toolbarHint}>
              {toolbarLabel ?? "Rich text"}
            </span>
          </>
        )}
      </div>

      <div
        className={`${classes.body} ${active ? classes.bodyActive : ""} ${
          variant === "code" ? classes.bodyCode : ""
        } ${resizable ? classes.bodyResizable : ""}`}
      >
        <Textarea
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          minRows={minRows}
          autosize={resizable ? false : autosize}
          disabled={disabled}
          placeholder={placeholder}
          error={error}
          styles={
            resizable
              ? {
                  root: {
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    minHeight: 0,
                  },
                  wrapper: {
                    flex: 1,
                    minHeight: 0,
                  },
                  input: {
                    height: "100%",
                    minHeight: 0,
                    overflow: "auto",
                    resize: "none",
                  },
                }
              : undefined
          }
        />
        {hint ? <span className={classes.hint}>{hint}</span> : null}
      </div>

      {resizable ? (
        <div
          className={classes.resizeHandle}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize editor"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
        />
      ) : null}
    </div>
  );
}
