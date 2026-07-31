import { Badge, Button, Collapse, Group, Text, Textarea } from "@mantine/core";
import { useState } from "react";

import { FrameworkDiagramPanel } from "#app/components/paper-v2/FrameworkDiagramPanel";
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
    label: "4. Expected Results",
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
    hint: "From Library · Stitched · 0 tokens",
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
                  <Textarea
                    minRows={6}
                    autosize
                    value={content}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [key]: e.currentTarget.value }))
                    }
                  />
                ) : (
                  <Text size="sm" className={classes.readonly}>
                    {content || "No references compiled yet — cite Library sources first."}
                  </Text>
                )}
                {section.editable && key !== "diagram" && (
                  <Group mt={8} gap={8}>
                    <Button
                      size="xs"
                      loading={savingKey === key}
                      onClick={() => onSave(key, content)}
                    >
                      Save section
                    </Button>
                    {regeneratable && onRegenerate ? (
                      <Button
                        size="xs"
                        variant="light"
                        loading={regeneratingKey === key}
                        onClick={() => onRegenerate(key)}
                      >
                        Regenerate (AI)
                      </Button>
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
