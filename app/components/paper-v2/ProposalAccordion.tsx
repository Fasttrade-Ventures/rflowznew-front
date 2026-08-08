import { Badge, Button, Collapse, Group, Text } from "@mantine/core";
import { useState } from "react";

import { FrameworkDiagramPanel } from "#app/components/paper-v2/FrameworkDiagramPanel";
import { AskProfZButton } from "#app/components/paper-v2/AskProfZButton";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import type { ProposalSection } from "#app/services/proposal-assembly.server";
import classes from "./proposal-accordion.module.css";

/** 9 body sections in reference-proposal order + abstract panel + diagram/references */
const SECTION_ORDER: Array<{
  key: string;
  label: string;
  hint?: string;
  regeneratable?: boolean;
  readonly?: boolean;
}> = [
  {
    key: "introduction",
    label: "1. Background Study",
    hint: "Ask Prof Z · affirmative landscape then cited pivot · ✎ editable",
    regeneratable: true,
  },
  {
    key: "problem_statement",
    label: "2. Problem Statement",
    hint: "Sourced from Problem Statement screen · edit there to update",
    readonly: true,
  },
  {
    key: "lit_review",
    label: "3. Literature Review",
    hint: "1 AI call on first visit · ✎ editable",
    regeneratable: true,
  },
  {
    key: "research_question",
    label: "4. Research Question",
    hint: "Sourced from Research Questions screen · edit there to update",
    readonly: true,
  },
  {
    key: "research_objectives",
    label: "5. Research Objectives",
    hint: "Sourced from Research Questions screen · edit there to update",
    readonly: true,
  },
  {
    key: "methodology",
    label: "6. Methodology",
    hint: "Ask Prof Z · one continuous design narrative · ✎ editable",
    regeneratable: true,
  },
  {
    key: "benefits",
    label: "7. Research Significance",
    hint: "1 AI call on first visit · includes 7.1 Practical & 7.2 Research contributions · ✎ editable",
    regeneratable: true,
  },
  {
    key: "expected_results",
    label: "8. Expert Review",
    hint: "Ask Prof Z · 6-task expert panel validation · field-specific stakeholders · ✎ editable",
    regeneratable: true,
  },
  {
    key: "conclusion",
    label: "9. Conclusion",
    hint: "Ask Prof Z · elaborated synthesis from problem, gap, method, contribution · ✎ editable",
    regeneratable: true,
  },
  {
    key: "references",
    label: "References (APA 7)",
    hint: "From Library · Stitched · 0 tokens · ✎ editable",
  },
  {
    key: "diagram",
    label: "Framework Diagram",
    hint: "From Screen 8 Frameworks · Stitched · 0 tokens",
  },
];

type ProposalAccordionProps = {
  paperId: string;
  sections: Record<string, ProposalSection>;
  abstractBody?: string;
  isGeneratingAbstract?: boolean;
  onSave: (key: string, content: string) => void;
  onRegenerate?: (key: string) => void;
  onGenerateAbstract?: () => void;
  onSaveAbstract?: (body: string) => void;
  savingKey?: string | null;
  regeneratingKey?: string | null;
};

function sourceLabel(source: ProposalSection["source"]) {
  if (source === "ai") return "AI";
  if (source === "edited") return "Edited";
  return "Stitched";
}

export function ProposalAccordion({
  paperId,
  sections,
  abstractBody,
  isGeneratingAbstract,
  onSave,
  onRegenerate,
  onGenerateAbstract,
  onSaveAbstract,
  savingKey,
  regeneratingKey,
}: ProposalAccordionProps) {
  const [openKey, setOpenKey] = useState<string>("abstract");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [abstractDraft, setAbstractDraft] = useState<string | undefined>(
    undefined
  );

  const currentAbstract = abstractDraft ?? abstractBody ?? "";

  return (
    <div className={classes.wrap}>
      {/* Abstract — stored separately in abstract_secs, not proposal_assemblies */}
      <section className={classes.section}>
        <button
          type="button"
          className={classes.header}
          onClick={() => setOpenKey(openKey === "abstract" ? "" : "abstract")}
        >
          <Text size="sm" fw={600}>
            Abstract
          </Text>
          <Group gap={6}>
            <Badge size="xs" variant="light">
              {currentAbstract ? "Saved" : "Missing"}
            </Badge>
            <Text size="xs" c="dimmed">
              {openKey === "abstract" ? "▾" : "▸"}
            </Text>
          </Group>
        </button>
        <Collapse in={openKey === "abstract"}>
          <div className={classes.body}>
            <div className={classes.hint}>
              ~150–200 word summary · appears above section 1 in DOCX · generate
              once before export
            </div>
            <RichTextEditorShell
              value={currentAbstract}
              onChange={(text) => setAbstractDraft(text)}
              active={focusedKey === "abstract"}
              previewable
              defaultMode={
                focusedKey === "abstract" ? "edit" : "preview"
              }
              minRows={5}
              disabled={isGeneratingAbstract}
              placeholder="Generate the abstract before exporting — it summarises background, problem, methodology and contribution in 150–200 words."
              hint="✎ Click to edit"
              onFocus={() => setFocusedKey("abstract")}
              onBlur={() =>
                setFocusedKey((current) =>
                  current === "abstract" ? null : current
                )
              }
            />
            <Group mt={8} gap={8} align="center">
              <Button
                size="xs"
                loading={savingKey === "abstract"}
                onClick={() => onSaveAbstract?.(currentAbstract)}
                disabled={!currentAbstract}
              >
                Save abstract
              </Button>
              <AskProfZButton
                onClick={() => onGenerateAbstract?.()}
                loading={isGeneratingAbstract}
                disabled={isGeneratingAbstract}
              />
            </Group>
          </div>
        </Collapse>
      </section>

      {/* 9 body sections */}
      {SECTION_ORDER.map(({ key, label, hint, regeneratable, readonly }) => {
        const section = sections[key];
        if (!section) return null;
        const content = drafts[key] ?? section.content ?? "";
        const isOpen = openKey === key;

        return (
          <section key={key} className={classes.section}>
            <button
              type="button"
              className={classes.header}
              onClick={() => setOpenKey(isOpen ? "" : key)}
            >
              <Text size="sm" fw={600}>
                {label}
              </Text>
              <Group gap={6}>
                {readonly ? (
                  <Badge size="xs" variant="light" color="gray">
                    Read-only
                  </Badge>
                ) : (
                  <Badge size="xs" variant="light">
                    {sourceLabel(section.source)}
                  </Badge>
                )}
                <Text size="xs" c="dimmed">
                  {isOpen ? "▾" : "▸"}
                </Text>
              </Group>
            </button>
            <Collapse in={isOpen}>
              <div className={classes.body}>
                {hint ? <div className={classes.hint}>{hint}</div> : null}
                {key === "diagram" ? (
                  <FrameworkDiagramPanel
                    paperId={paperId}
                    mermaidSource={content}
                    imageUrl={section.image_url}
                  />
                ) : readonly ? (
                  <Text
                    size="sm"
                    className={classes.readonly}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {content ||
                      "No content yet — complete the upstream screen first."}
                  </Text>
                ) : (
                  <RichTextEditorShell
                    value={content}
                    onChange={(text) =>
                      setDrafts((d) => ({ ...d, [key]: text }))
                    }
                    active={focusedKey === key}
                    previewable
                    defaultMode={focusedKey === key ? "edit" : "preview"}
                    minRows={key === "references" ? 8 : 6}
                    disabled={regeneratingKey === key}
                    placeholder={
                      key === "references"
                        ? "APA 7 references — one entry per paragraph"
                        : key === "expected_results"
                          ? "Ask Prof Z to generate the Expert Review section — describes 6-task expert panel validation with field-specific stakeholders"
                          : key === "conclusion"
                            ? "Ask Prof Z for a 5–8 sentence synthesis of problem, gap, method, and contribution"
                            : `Edit ${label.toLowerCase()}…`
                    }
                    hint="✎ Click to edit"
                    onFocus={() => setFocusedKey(key)}
                    onBlur={() =>
                      setFocusedKey((current) =>
                        current === key ? null : current
                      )
                    }
                  />
                )}
                {!readonly && section.editable && key !== "diagram" && (
                  <Group
                    mt={8}
                    gap={8}
                    align="center"
                    className={
                      regeneratable ? classes.actionsWithProfZ : undefined
                    }
                  >
                    <Button
                      size="xs"
                      loading={savingKey === key}
                      onClick={() => onSave(key, content)}
                    >
                      Save section
                    </Button>
                    {regeneratable && onRegenerate ? (
                      <AskProfZButton
                        onClick={() => onRegenerate(key)}
                        loading={regeneratingKey === key}
                        disabled={regeneratingKey === key}
                      />
                    ) : null}
                  </Group>
                )}
              </div>
            </Collapse>
          </section>
        );
      })}
    </div>
  );
}
