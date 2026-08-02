import { Badge, Button, Collapse, Group, Text } from "@mantine/core";
import { useState } from "react";

import { FrameworkDiagramPanel } from "#app/components/paper-v2/FrameworkDiagramPanel";
import { AskProfZButton } from "#app/components/paper-v2/AskProfZButton";
import { RichTextEditorShell } from "#app/components/paper-v2/RichTextEditorShell";
import type { ProposalSection } from "#app/services/proposal-assembly.server";
import classes from "./proposal-accordion.module.css";

const SECTION_ORDER: Array<{
  key: string;
  label: string;
  hint?: string;
  regeneratable?: boolean;
}> = [
  { key: "introduction", label: "1. Introduction", hint: "From Screens 3–4 · Stitched · 0 tokens · ✎ editable" },
  {
    key: "lit_review",
    label: "2. Literature Review",
    hint: "1 AI call on first visit · ✎ editable",
    regeneratable: true,
  },
  {
    key: "methodology",
    label: "3. Proposed Methodology & Analysis",
    hint: "Method-adaptive (propositions, not IV/DV) · Stitched · 0 tokens · ✎ editable",
  },
  {
    key: "expected_results",
    label: "4. Research Question",
    hint: "From Screen 5 RQs · Stitched · 0 tokens · ✎ editable",
  },
  {
    key: "conclusion",
    label: "5. Conclusion",
    hint: "Stitched from §1–§5 · Stitched · 0 tokens · ✎ editable",
  },
  {
    key: "benefits",
    label: "6. Benefits & Contribution",
    hint: "1 AI call on first visit · ✎ editable",
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
  onSave: (key: string, content: string) => void;
  onRegenerate?: (key: string) => void;
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
  onSave,
  onRegenerate,
  savingKey,
  regeneratingKey,
}: ProposalAccordionProps) {
  const [openKey, setOpenKey] = useState<string>("introduction");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  return (
    <div className={classes.wrap}>
      {SECTION_ORDER.map(({ key, label, hint, regeneratable }) => {
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
                <Badge size="xs" variant="light">
                  {sourceLabel(section.source)}
                </Badge>
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
                ) : section.editable ? (
                  <RichTextEditorShell
                    value={content}
                    onChange={(text) =>
                      setDrafts((d) => ({ ...d, [key]: text }))
                    }
                    active={focusedKey === key}
                    minRows={key === "references" ? 8 : 6}
                    disabled={regeneratingKey === key}
                    placeholder={
                      key === "references"
                        ? "APA 7 references — one entry per paragraph"
                        : `Edit ${label.toLowerCase()}…`
                    }
                    hint="✎ Click to edit"
                    onFocus={() => setFocusedKey(key)}
                    onBlur={() =>
                      setFocusedKey((current) => (current === key ? null : current))
                    }
                  />
                ) : (
                  <Text size="sm" className={classes.readonly}>
                    {content || "No references compiled yet — cite Library sources first."}
                  </Text>
                )}
                {section.editable && key !== "diagram" && (
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
