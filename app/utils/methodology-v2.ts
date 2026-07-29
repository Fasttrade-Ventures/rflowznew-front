export type MethodologyDesignKey =
  | "yin_case_study"
  | "ipa"
  | "stake_case_study";

export type MethodologyMeta = {
  design?: MethodologyDesignKey;
  collection?: string[];
  analysis?: string;
  sampling?: string;
  coherence_overridden?: boolean;
  override_reason?: string;
};

export type MethodologyV2FormValues = {
  meta: MethodologyMeta;
  methodology_paragraph: string;
};

export const METHODOLOGY_DESIGN_OPTIONS: Array<{
  key: MethodologyDesignKey;
  title: string;
  hint: string;
  recommended?: boolean;
}> = [
  {
    key: "yin_case_study",
    title: "Yin case study",
    hint: "Post-positivist · propositions · construct validity",
  },
  {
    key: "ipa",
    title: "IPA",
    hint: "Click to switch — fits interpretivism + RQ2",
    recommended: true,
  },
  {
    key: "stake_case_study",
    title: "Stake's interpretive case study",
    hint: "Interpretive case study aligned with constructivism",
  },
];

export const METHODOLOGY_COLLECTION_OPTIONS = [
  { key: "semi_structured_interviews", label: "Semi-structured interviews" },
  { key: "go_along_observations", label: "Go-along observations" },
  { key: "surveys", label: "Surveys" },
] as const;

export const METHODOLOGY_ANALYSIS_OPTIONS = [
  { key: "thematic_analysis", label: "Thematic analysis" },
  { key: "ipa_4_stage", label: "IPA 4-stage cycle" },
] as const;

export const DEFAULT_SAMPLING =
  "Sampling: ~15–18 residents · 2–3 PPR blocks · purposive";

export function designLabel(key?: MethodologyDesignKey): string {
  return (
    METHODOLOGY_DESIGN_OPTIONS.find((option) => option.key === key)?.title ?? ""
  );
}

export function collectionLabels(keys: string[] = []): string[] {
  return keys
    .map(
      (key) =>
        METHODOLOGY_COLLECTION_OPTIONS.find((option) => option.key === key)
          ?.label
    )
    .filter(Boolean) as string[];
}

export function analysisLabel(key?: string): string {
  return (
    METHODOLOGY_ANALYSIS_OPTIONS.find((option) => option.key === key)?.label ??
    ""
  );
}

export function fromMethodologyRecord(
  methodology?: {
    research_design?: string | null;
    data_collection_methods?: string | null;
    analysis_techniques?: string | null;
    meta?: MethodologyMeta | null;
  } | null
): MethodologyV2FormValues {
  const meta = methodology?.meta ?? {};
  return {
    meta: {
      design: meta.design,
      collection: meta.collection ?? [],
      analysis: meta.analysis,
      sampling: meta.sampling ?? DEFAULT_SAMPLING,
      coherence_overridden: meta.coherence_overridden ?? false,
      override_reason: meta.override_reason ?? "",
    },
    methodology_paragraph: methodology?.research_design ?? "",
  };
}

export function toMethodologyPayload(values: MethodologyV2FormValues) {
  const collectionLabelsText = collectionLabels(values.meta.collection ?? []).join(
    ", "
  );

  return {
    research_design: values.methodology_paragraph,
    data_collection_methods: [collectionLabelsText, values.meta.sampling]
      .filter(Boolean)
      .join("\n"),
    analysis_techniques: analysisLabel(values.meta.analysis),
    software_and_tools: "",
    meta: values.meta,
  };
}

export function buildMethodologyParagraph(values: MethodologyV2FormValues): string {
  const design = designLabel(values.meta.design);
  const collection = collectionLabels(values.meta.collection ?? []).join(" and ");
  const analysis = analysisLabel(values.meta.analysis);
  const sampling = values.meta.sampling ?? DEFAULT_SAMPLING;

  if (!design || !collection || !analysis) {
    return "";
  }

  if (values.meta.design === "ipa") {
    return `This study adopts an interpretivist approach using Interpretative Phenomenological Analysis (IPA). Data will be collected through ${collection.toLowerCase()} with ${sampling.replace(/^Sampling:\s*/i, "")}. Analysis follows Smith's four-stage IPA cycle. Reflexivity logs and an audit trail ensure trustworthiness.`;
  }

  if (values.meta.design === "yin_case_study") {
    return `This study employs a case study design following Yin (2018), with ${collection.toLowerCase()} across ${sampling.replace(/^Sampling:\s*/i, "")}. Data will be analysed using ${analysis.toLowerCase()} to develop propositions and assess construct validity.`;
  }

  return `This study uses ${design.toLowerCase()} with ${collection.toLowerCase()} and ${analysis.toLowerCase()}. ${sampling}.`;
}

export function suggestedDesignKey(
  suggested?: string | null
): MethodologyDesignKey | null {
  if (!suggested) return null;
  const normalized = suggested.toLowerCase();
  if (normalized.includes("ipa")) return "ipa";
  if (normalized.includes("stake")) return "stake_case_study";
  if (normalized.includes("yin")) return "yin_case_study";
  return null;
}

export function evaluateCoherenceClient({
  paradigm,
  values,
}: {
  paradigm?: string | null;
  values: MethodologyV2FormValues;
}): {
  warnings: Array<{
    code: string;
    message: string;
    suggested_design?: string;
    philosophy?: string;
    selected_design?: string;
  }>;
  report: Array<{ key: string; label: string; status: "ok" | "fail" }>;
  aligned: boolean;
  suggested_design: string | null;
} {
  const warnings: Array<{
    code: string;
    message: string;
    suggested_design?: string;
    philosophy?: string;
    selected_design?: string;
  }> = [];
  const paradigmText = paradigm ?? "";
  const isInterpretivist =
    /interpretiv|constructiv|qualitative/i.test(paradigmText);
  const design = values.meta.design;
  const overridden = values.meta.coherence_overridden;

  if (
    isInterpretivist &&
    design === "yin_case_study" &&
    !overridden
  ) {
    warnings.push({
      code: "yin_interpretivism_mismatch",
      message:
        "You clicked Yin case study above, but your philosophy is Interpretivism. Yin leans positivist. Click IPA in the SELECT section, or click Override below.",
      suggested_design: "IPA",
      philosophy: "Interpretivism",
      selected_design: "Yin case study",
    });
  }

  const hasPhilosophy = Boolean(paradigmText.trim());
  const hasDesign = Boolean(design);
  const hasSampling =
    Boolean(values.meta.sampling?.trim()) ||
    (values.meta.collection?.length ?? 0) > 0;
  const designAligned = hasDesign && (warnings.length === 0 || overridden);

  const report = [
    { key: "philosophy", label: "Philosophy", status: hasPhilosophy ? "ok" : "fail" },
    { key: "rq_fit", label: "RQ fit", status: hasDesign ? "ok" : "fail" },
    { key: "sampling", label: "Sampling", status: hasSampling ? "ok" : "fail" },
    {
      key: "design",
      label: "Design",
      status: designAligned ? "ok" : "fail",
    },
  ] as const;

  return {
    warnings,
    report: [...report],
    aligned: warnings.length === 0 || overridden,
    suggested_design: warnings[0]?.suggested_design ?? null,
  };
}
