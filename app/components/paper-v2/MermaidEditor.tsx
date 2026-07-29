import { Button, Group, Textarea } from "@mantine/core";
import { useState } from "react";

import type { MermaidExportPayload } from "#app/utils/export-mermaid-png";
import { MermaidPreview } from "./MermaidPreview";

type MermaidEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave?: (svgData?: string) => void;
  onGenerate?: () => void;
  generating?: boolean;
};

export function MermaidEditor({
  value,
  onChange,
  onSave,
  onGenerate,
  generating,
}: MermaidEditorProps) {
  const [svgExport, setSvgExport] = useState<MermaidExportPayload | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
      <div>
        <Textarea
          label="Mermaid source"
          minRows={12}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          styles={{ input: { fontFamily: "monospace", fontSize: 11 } }}
        />
        <Group mt="sm" gap={8}>
          {onGenerate && (
            <Button size="xs" onClick={onGenerate} loading={generating}>
              Ask Prof Z
            </Button>
          )}
          {onSave && (
            <Button size="xs" variant="light" onClick={() => onSave(svgExport?.dataUri)}>
              Save diagram
            </Button>
          )}
        </Group>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Preview</div>
        <MermaidPreview source={value} onSvgReady={setSvgExport} />
      </div>
    </div>
  );
}
