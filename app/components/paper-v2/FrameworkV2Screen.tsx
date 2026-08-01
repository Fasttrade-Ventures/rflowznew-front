import { MermaidPreview } from "#app/components/paper-v2/MermaidPreview";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import type { loader as rootLoader } from "#app/root";
import type { LibraryEntry } from "#app/services/library.server";
import {
  downloadHighResMermaidPng,
  downloadMermaidSvg,
  toMermaidExportPayload,
  toMermaidPngDataUri,
  type MermaidExportPayload,
} from "#app/utils/export-mermaid-png";
import { prepareMermaidForEditor } from "#app/utils/sanitize-mermaid-source";
import { repairAndRenderMermaid } from "#app/utils/render-mermaid";
import { Alert } from "@mantine/core";
import { useRouteLoaderData } from "@remix-run/react";
import * as Ably from "ably";
import type { Message } from "ably";
import { useCallback, useEffect, useRef, useState } from "react";

import { FormSaveFooter } from "./FormSaveFooter";
import classes from "./framework-v2.module.css";
import { AskProfZButton } from "./AskProfZButton";

export type FrameworkV2FormValues = {
  theoretical_framework: string;
  mermaid_source: string;
};

type FrameworkV2ScreenProps = {
  paperId: string;
  libraryEntries: LibraryEntry[];
  initial: FrameworkV2FormValues;
  renderedPngUrl?: string | null;
  saving?: boolean;
  rendering?: boolean;
  saveError?: string | null;
  onSave: (values: FrameworkV2FormValues) => void;
  onGenerateDiagram: (values: FrameworkV2FormValues, svgData?: string) => void;
  onAskProfZTheoretical?: (ablyEvent: string) => void;
  onAskProfZMermaid?: (
    ablyEvent: string,
    values: FrameworkV2FormValues
  ) => void;
};

export function FrameworkV2Screen({
  paperId,
  libraryEntries,
  initial,
  renderedPngUrl,
  saving,
  rendering,
  saveError,
  onSave,
  onGenerateDiagram,
  onAskProfZTheoretical,
  onAskProfZMermaid,
}: FrameworkV2ScreenProps) {
  const [values, setValues] = useState<FrameworkV2FormValues>(initial);
  const [theoreticalFocused, setTheoreticalFocused] = useState(false);
  const [mermaidFocused, setMermaidFocused] = useState(false);
  const [previewSource, setPreviewSource] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [svgExport, setSvgExport] = useState<MermaidExportPayload | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [generatingTarget, setGeneratingTarget] = useState<
    "theoretical" | "mermaid" | null
  >(null);
  const theoreticalStreamRef = useRef("");
  const mermaidStreamRef = useRef("");
  const generatingTargetRef = useRef<"theoretical" | "mermaid" | null>(null);
  const theoreticalAblyEvent = "framework-theoretical";
  const mermaidAblyEvent = "framework-mermaid";
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const ablyKey = rootData?.ablyKey;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    generatingTargetRef.current = generatingTarget;
  }, [generatingTarget]);

  useEffect(() => {
    if (generatingTargetRef.current) return;
    setValues((current) => ({
      theoretical_framework: current.theoretical_framework.trim()
        ? current.theoretical_framework
        : initial.theoretical_framework,
      mermaid_source: current.mermaid_source.trim()
        ? current.mermaid_source
        : initial.mermaid_source,
    }));
  }, [initial.theoretical_framework, initial.mermaid_source]);

  const runMermaidPreview = useCallback(async (raw: string) => {
    if (!raw.trim()) return;

    const preRepaired = prepareMermaidForEditor(raw);

    setShowPreview(true);
    setPreviewError(null);
    setPreviewSvg(null);
    setSvgExport(null);
    setPreviewSource(preRepaired);
    setIsPreviewing(true);

    try {
      const { svg, repairedSource } = await repairAndRenderMermaid(preRepaired);

      setValues((current) => ({
        ...current,
        mermaid_source: repairedSource,
      }));
      setPreviewSource(repairedSource);
      setPreviewSvg(svg);
      setSvgExport(toMermaidExportPayload(svg));
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Could not render diagram"
      );
    } finally {
      setIsPreviewing(false);
    }
  }, []);

  const previewDiagram = useCallback(() => {
    void runMermaidPreview(values.mermaid_source);
  }, [runMermaidPreview, values.mermaid_source]);

  const handleTheoreticalMessage = useCallback((message: Message) => {
    if (generatingTargetRef.current !== "theoretical") return;

    if (message.data === "[DONE]") {
      const content = theoreticalStreamRef.current;
      theoreticalStreamRef.current = "";
      setValues((current) => ({
        ...current,
        theoretical_framework: content,
      }));
      setGeneratingTarget((current) => {
        if (current === "theoretical") {
          generatingTargetRef.current = null;
          return null;
        }
        return current;
      });
      return;
    }
    theoreticalStreamRef.current += String(message.data);
    setValues((current) => ({
      ...current,
      theoretical_framework: theoreticalStreamRef.current,
    }));
  }, []);

  const handleMermaidMessage = useCallback((message: Message) => {
    if (generatingTargetRef.current !== "mermaid") return;

    if (message.data === "[DONE]") {
      const raw = mermaidStreamRef.current;
      mermaidStreamRef.current = "";
      setGeneratingTarget((current) => {
        if (current === "mermaid") {
          generatingTargetRef.current = null;
          return null;
        }
        return current;
      });
      void runMermaidPreview(raw);
      return;
    }
    mermaidStreamRef.current += String(message.data);
    setValues((current) => ({
      ...current,
      mermaid_source: mermaidStreamRef.current,
    }));
  }, [runMermaidPreview]);

  useEffect(() => {
    if (!ablyKey || !paperId) return;

    const ably = new Ably.Realtime({
      key: ablyKey,
      clientId: `rflowz-${paperId}`,
    });

    let channel: Ably.RealtimeChannel | null = null;

    const onConnected = () => {
      channel = ably.channels.get(`paper-${paperId}`);
      channel.subscribe(theoreticalAblyEvent, handleTheoreticalMessage);
      channel.subscribe(mermaidAblyEvent, handleMermaidMessage);
    };

    ably.connection.on("connected", onConnected);
    if (ably.connection.state === "connected") {
      onConnected();
    }

    return () => {
      if (channel) {
        channel.unsubscribe(theoreticalAblyEvent, handleTheoreticalMessage);
        channel.unsubscribe(mermaidAblyEvent, handleMermaidMessage);
      }
      ably.connection.off("connected", onConnected);
      ably.close();
    };
  }, [
    ablyKey,
    paperId,
    theoreticalAblyEvent,
    mermaidAblyEvent,
    handleTheoreticalMessage,
    handleMermaidMessage,
  ]);

  const askProfZTheoretical = () => {
    if (!onAskProfZTheoretical) return;
    theoreticalStreamRef.current = "";
    generatingTargetRef.current = "theoretical";
    setValues((current) => ({ ...current, theoretical_framework: "" }));
    setGeneratingTarget("theoretical");
    onAskProfZTheoretical(theoreticalAblyEvent);
  };

  const askProfZMermaid = () => {
    if (!onAskProfZMermaid) return;
    mermaidStreamRef.current = "";
    generatingTargetRef.current = "mermaid";
    setValues((current) => ({ ...current, mermaid_source: "" }));
    setGeneratingTarget("mermaid");
    onAskProfZMermaid(mermaidAblyEvent, values);
  };

  const libraryNames = libraryEntries
    .slice(0, 4)
    .map((entry) => entry.title.split(" ")[0])
    .join(", ");

  const downloadSvg = () => {
    if (!svgExport?.svg) return;
    downloadMermaidSvg(svgExport.svg);
  };

  const downloadPng = async () => {
    if (!svgExport?.svg) return;
    try {
      await downloadHighResMermaidPng(svgExport.svg);
    } catch {
      // Fallback to data URI if high-res export fails
      if (!svgExport.dataUri) return;
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth * 3;
        canvas.height = image.naturalHeight * 3;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "framework-diagram.png";
          link.click();
          URL.revokeObjectURL(url);
        });
      };
      image.src = svgExport.dataUri;
    }
  };

  const embedInProposal = async () => {
    if (!svgExport?.svg || !values.mermaid_source.trim()) return;
    setIsEmbedding(true);
    setPreviewError(null);
    try {
      let imageData = svgExport.dataUri;
      try {
        imageData = await toMermaidPngDataUri(svgExport.svg);
      } catch (pngError) {
        console.warn("Client PNG conversion failed; sending SVG for server render", pngError);
      }
      onGenerateDiagram(values, imageData);
    } catch (error) {
      console.error("Framework diagram embed failed", error);
      setPreviewError(
        "Could not embed the diagram. Preview it again, then retry Embed in proposal."
      );
    } finally {
      setIsEmbedding(false);
    }
  };

  const isGeneratingTheoretical = generatingTarget === "theoretical";
  const isGeneratingMermaid = generatingTarget === "mermaid";

  return (
    <div className={classes.shell}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Frameworks</div>
        <div className={classes.pageSub}>
          Theoretical + conceptual framework builders · every node citation-linked
          from Library
        </div>
      </div>

      <div className={classes.body}>
        <div className={classes.libraryBanner}>
          <strong>{libraryEntries.length} Library sources linked</strong>
          <span>→ feeds Prof Z for both narrative and Mermaid diagram</span>
          {libraryNames ? <span>({libraryNames}…)</span> : null}
        </div>

        <div className={classes.layout}>
          <aside className={classes.libraryPanel}>
            <div className={classes.libraryTitle}>Library theories</div>
            <div className={classes.libraryHint}>
              Prof Z reads these sources plus your main research question when
              drafting the theoretical framework and Mermaid flowchart.
            </div>
            <div className={classes.libraryList}>
              {libraryEntries.length === 0 ? (
                <div className={classes.libraryItem}>
                  <div className={classes.libraryItemTitle}>
                    No library sources yet
                  </div>
                  <div className={classes.libraryItemMeta}>
                    Add sources on the Source Library screen first.
                  </div>
                </div>
              ) : (
                libraryEntries.map((entry) => (
                  <div key={entry.id} className={classes.libraryItem}>
                    <div className={classes.libraryItemTitle}>{entry.title}</div>
                    <div className={classes.libraryItemMeta}>
                      {[entry.source, entry.year].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <div className={classes.mainColumn}>
            <section className={classes.sectionCard}>
              <div className={classes.editorHeader}>
                <div>
                  <div className={classes.sectionTitle}>Theoretical framework</div>
                  <div className={classes.sectionHint}>
                    Proposal narrative — constructs, relationships, and Library
                    grounding. Prof Z uses Library + your main RQ.
                  </div>
                </div>
                {onAskProfZTheoretical ? (
                  <AskProfZButton
                    onClick={askProfZTheoretical}
                    disabled={isGeneratingTheoretical || libraryEntries.length === 0}
                    loading={isGeneratingTheoretical}
                  />
                ) : null}
              </div>
              <RichTextEditorShell
                value={values.theoretical_framework}
                onChange={(text) =>
                  setValues((current) => ({
                    ...current,
                    theoretical_framework: text,
                  }))
                }
                active={theoreticalFocused}
                minRows={5}
                disabled={isGeneratingTheoretical}
                placeholder="Describe constructs, relationships, and theoretical grounding from your Library..."
                hint="✎ Click to edit · goes into your proposal theoretical framework section"
                onFocus={() => setTheoreticalFocused(true)}
                onBlur={() => setTheoreticalFocused(false)}
              />
            </section>

            <section className={classes.sectionCard}>
              <div className={classes.editorHeader}>
                <div>
                  <div className={classes.sectionTitle}>
                    Mermaid source (editable)
                  </div>
                  <div className={classes.sectionHint}>
                    Visual diagram code. Prof Z uses Library + main RQ + your
                    theoretical framework text above.
                  </div>
                </div>
                {onAskProfZMermaid ? (
                  <AskProfZButton
                    onClick={askProfZMermaid}
                    disabled={isGeneratingMermaid || libraryEntries.length === 0}
                    loading={isGeneratingMermaid}
                  />
                ) : null}
              </div>
              <RichTextEditorShell
                value={values.mermaid_source}
                onChange={(text) =>
                  setValues((current) => ({ ...current, mermaid_source: text }))
                }
                active={mermaidFocused}
                variant="code"
                resizable
                initialHeight={240}
                minHeight={140}
                maxHeight={720}
                minRows={10}
                disabled={isGeneratingMermaid}
                placeholder="flowchart TD&#10;  A[Construct] --> B[Outcome]"
                hint="Drag the bottom edge to resize · edit before generating"
                onFocus={() => setMermaidFocused(true)}
                onBlur={() => setMermaidFocused(false)}
              />
            </section>

            <div className={classes.generateRow}>
              <button
                type="button"
                className={classes.generateBtn}
                disabled={isPreviewing || !values.mermaid_source.trim()}
                onClick={previewDiagram}
              >
                {isPreviewing ? "Repairing & rendering…" : "▶ Preview diagram"}
              </button>
              <span className={classes.generateHint}>
                Step 1: repair Mermaid syntax · Step 2: render preview below
              </span>
            </div>

            <section className={classes.diagramBlock}>
              <div className={classes.previewCard}>
                <div className={classes.previewTitle}>Diagram preview</div>
                {isClient && showPreview ? (
                  <MermaidPreview
                    source={previewSource}
                    svg={previewSvg}
                    loading={isPreviewing}
                    error={previewError}
                    onSvgReady={setSvgExport}
                  />
                ) : (
                  <div className={classes.previewEmpty}>
                    {previewError ? (
                      <span className={classes.previewError}>{previewError}</span>
                    ) : (
                      <>
                        Click <strong>Preview diagram</strong> above to render your
                        Mermaid code here.
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={classes.exportRow}>
                <button
                  type="button"
                  className={`${classes.exportBtn} ${classes.exportBtnPrimary}`}
                  disabled={
                    rendering ||
                    isEmbedding ||
                    !svgExport?.dataUri ||
                    !values.mermaid_source.trim()
                  }
                  onClick={() => void embedInProposal()}
                >
                  {rendering || isEmbedding ? "Embedding…" : "Embed in proposal"}
                </button>
                <button
                  type="button"
                  className={classes.exportBtn}
                  disabled={!svgExport?.svg}
                  onClick={downloadPng}
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  className={classes.exportBtn}
                  disabled={!svgExport?.svg}
                  onClick={downloadSvg}
                >
                  Download SVG
                </button>
              </div>

              <section className={classes.profNote}>
                <span className={classes.profNoteAvatar} aria-hidden />
                <div>
                  <div className={classes.profNoteTitle}>Prof Z</div>
                  <div className={classes.profNoteText}>
                    {libraryEntries.length > 0
                      ? `Step 1: Ask Prof Z on Theoretical framework. Step 2: Ask Prof Z on Mermaid. Step 3: Preview diagram. Step 4: Embed in proposal or download.`
                      : "Add Library sources first. Then use Ask Prof Z on the theoretical narrative, then on Mermaid, then Preview diagram."}
                  </div>
                </div>
              </section>
            </section>
          </div>
        </div>
      </div>

      <FormSaveFooter
        type="button"
        loading={saving}
        onClick={() => onSave(values)}
        before={
          saveError ? (
            <Alert color="red" variant="light">
              {saveError}
            </Alert>
          ) : null
        }
      >
        Save framework
      </FormSaveFooter>
    </div>
  );
}
