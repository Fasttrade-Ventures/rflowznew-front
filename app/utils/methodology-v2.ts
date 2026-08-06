/** Legacy shortlist keys — kept only so older saved meta still loads. */
export type MethodologyDesignKey =
  | "yin_case_study"
  | "ipa"
  | "stake_case_study";

export type MethodologyRecommendation = {
  recommended_design?: string;
  justification?: string;
  sampling?: string;
  data_collection?: string;
  data_analysis?: string;
  software?: string;
  alternatives?: Array<{ design?: string; reason?: string }>;
};

export type MethodologyMeta = {
  /** @deprecated Prefer recommended_design_label (free-text Prof Z draft). */
  design?: MethodologyDesignKey;
  /** @deprecated Prefer recommended_data_collection. */
  collection?: string[];
  /** @deprecated Prefer recommended_data_analysis. */
  analysis?: string;
  sampling?: string;
  coherence_overridden?: boolean;
  override_reason?: string;
  recommended_design_label?: string;
  recommendation_justification?: string;
  recommended_software?: string;
  recommended_data_collection?: string;
  recommended_data_analysis?: string;
  recommendation_alternatives?: Array<{ design?: string; reason?: string }>;
  prof_z_recommendation?: MethodologyRecommendation;
};

export type MethodologyV2FormValues = {
  meta: MethodologyMeta;
  methodology_paragraph: string;
};

export const DEFAULT_SAMPLING = "";

const LEGACY_DESIGN_TITLES: Record<MethodologyDesignKey, string> = {
  yin_case_study: "Yin case study",
  ipa: "IPA",
  stake_case_study: "Stake's interpretive case study",
};

const LEGACY_COLLECTION_LABELS: Record<string, string> = {
  semi_structured_interviews: "Semi-structured interviews",
  go_along_observations: "Go-along observations",
  surveys: "Surveys",
};

const LEGACY_ANALYSIS_LABELS: Record<string, string> = {
  thematic_analysis: "Thematic analysis",
  ipa_4_stage: "IPA 4-stage cycle",
};

export function designDraftText(meta: MethodologyMeta): string {
  return (
    meta.recommended_design_label?.trim() ||
    (meta.design ? LEGACY_DESIGN_TITLES[meta.design] : "") ||
    ""
  );
}

export function collectionDraftText(meta: MethodologyMeta): string {
  if (meta.recommended_data_collection?.trim()) {
    return meta.recommended_data_collection.trim();
  }
  const fromKeys = (meta.collection ?? [])
    .map((key) => LEGACY_COLLECTION_LABELS[key] ?? key)
    .filter(Boolean)
    .join("; ");
  return fromKeys;
}

export function analysisDraftText(meta: MethodologyMeta): string {
  if (meta.recommended_data_analysis?.trim()) {
    return meta.recommended_data_analysis.trim();
  }
  if (meta.analysis) {
    return LEGACY_ANALYSIS_LABELS[meta.analysis] ?? meta.analysis;
  }
  return "";
}

export function applyMethodologyRecommendation(
  current: MethodologyV2FormValues,
  recommendation: MethodologyRecommendation
): MethodologyV2FormValues {
  const next: MethodologyV2FormValues = {
    ...current,
    meta: {
      ...current.meta,
      // Clear legacy shortlist keys so UI/save path is free-text only.
      design: undefined,
      collection: undefined,
      analysis: undefined,
      sampling: recommendation.sampling ?? current.meta.sampling ?? "",
      recommended_design_label: recommendation.recommended_design,
      recommendation_justification: recommendation.justification,
      recommended_software: recommendation.software,
      recommended_data_collection: recommendation.data_collection,
      recommended_data_analysis: recommendation.data_analysis,
      recommendation_alternatives: recommendation.alternatives ?? [],
      prof_z_recommendation: recommendation,
      coherence_overridden: false,
    },
  };
  // Always refresh the starter paragraph from the new drafts when recommending.
  next.methodology_paragraph = buildMethodologyParagraph(next);
  return next;
}

export function fromMethodologyRecord(
  methodology?: {
    research_design?: string | null;
    data_collection_methods?: string | null;
    analysis_techniques?: string | null;
    software_and_tools?: string | null;
    meta?: MethodologyMeta | null;
  } | null
): MethodologyV2FormValues {
  const meta = methodology?.meta ?? {};
  const recommendation = meta.prof_z_recommendation;
  return {
    meta: {
      design: meta.design,
      collection: meta.collection,
      analysis: meta.analysis,
      sampling: meta.sampling ?? DEFAULT_SAMPLING,
      coherence_overridden: meta.coherence_overridden ?? false,
      override_reason: meta.override_reason ?? "",
      recommended_design_label:
        meta.recommended_design_label ?? recommendation?.recommended_design,
      recommendation_justification:
        meta.recommendation_justification ?? recommendation?.justification,
      recommended_software:
        meta.recommended_software ??
        recommendation?.software ??
        methodology?.software_and_tools ??
        undefined,
      recommended_data_collection:
        meta.recommended_data_collection ?? recommendation?.data_collection,
      recommended_data_analysis:
        meta.recommended_data_analysis ?? recommendation?.data_analysis,
      recommendation_alternatives:
        meta.recommendation_alternatives ?? recommendation?.alternatives ?? [],
      prof_z_recommendation: recommendation,
    },
    methodology_paragraph: methodology?.research_design ?? "",
  };
}

export function toMethodologyPayload(values: MethodologyV2FormValues) {
  const design = designDraftText(values.meta);
  const collection = collectionDraftText(values.meta);
  const analysis = analysisDraftText(values.meta);
  const paragraph = values.methodology_paragraph.trim();

  // Persist drafts in columns for progress ticks. Export stitch prefers the
  // written paragraph when present, so these drafts no longer get double-joined.
  return {
    research_design: paragraph,
    data_collection_methods: [collection, values.meta.sampling]
      .filter(Boolean)
      .join("\n"),
    analysis_techniques: analysis,
    software_and_tools: values.meta.recommended_software ?? "",
    meta: {
      ...values.meta,
      design: undefined,
      collection: undefined,
      analysis: undefined,
      recommended_design_label: design || values.meta.recommended_design_label,
      recommended_data_collection:
        collection || values.meta.recommended_data_collection,
      recommended_data_analysis:
        analysis || values.meta.recommended_data_analysis,
    },
  };
}

export function buildMethodologyParagraph(
  values: MethodologyV2FormValues
): string {
  const design = designDraftText(values.meta);
  const collection = collectionDraftText(values.meta);
  const analysis = analysisDraftText(values.meta);
  const sampling = values.meta.sampling?.trim() ?? "";
  const software = values.meta.recommended_software?.trim() ?? "";

  if (!design || !collection || !analysis) {
    return "";
  }

  const samplingBit = sampling
    ? ` ${sampling.replace(/^Sampling:\s*/i, "").replace(/\.$/, "")}.`
    : "";
  const softwareLabel = software
    .replace(/\s*\(external tool recommendation[^)]*\)\s*/i, "")
    .trim();
  const softwareBit = softwareLabel
    ? ` Analysis may be supported with ${softwareLabel}.`
    : "";

  return `This study adopts ${design}, with data collected through ${collection.charAt(0).toLowerCase()}${collection.slice(1)}.${samplingBit} Data will be analysed using ${analysis.charAt(0).toLowerCase()}${analysis.slice(1)}.${softwareBit}`;
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
  const designText = designDraftText(values.meta);
  const overridden = values.meta.coherence_overridden;
  const positivistOrDsr =
    /\byin\b|design science|\bdsr\b|post-?positiv/i.test(designText);

  if (isInterpretivist && positivistOrDsr && !overridden && designText) {
    warnings.push({
      code: "design_paradigm_mismatch",
      message:
        "The drafted design looks positivist or design/artifact-oriented, but your philosophy is interpretivist/constructivist. Ask Prof Z to recommend again, or edit the design draft to a qualitative approach (e.g. IPA, case study, grounded theory).",
      suggested_design: "Interpretative Phenomenological Analysis (IPA)",
      philosophy: paradigmText || "Interpretivism",
      selected_design: designText,
    });
  }

  const hasPhilosophy = Boolean(paradigmText.trim());
  const hasDesign = Boolean(designText.trim());
  const hasSampling = Boolean(values.meta.sampling?.trim());
  const hasCollection = Boolean(collectionDraftText(values.meta).trim());
  const hasAnalysis = Boolean(analysisDraftText(values.meta).trim());
  const designAligned = hasDesign && (warnings.length === 0 || overridden);

  const report = [
    {
      key: "philosophy",
      label: "Philosophy",
      status: hasPhilosophy ? ("ok" as const) : ("fail" as const),
    },
    {
      key: "rq_fit",
      label: "Design draft",
      status: hasDesign ? ("ok" as const) : ("fail" as const),
    },
    {
      key: "sampling",
      label: "Sampling",
      status: hasSampling && hasCollection ? ("ok" as const) : ("fail" as const),
    },
    {
      key: "analysis",
      label: "Analysis",
      status: hasAnalysis ? ("ok" as const) : ("fail" as const),
    },
    {
      key: "design",
      label: "Paradigm fit",
      status: designAligned ? ("ok" as const) : ("fail" as const),
    },
  ];

  return {
    warnings,
    report,
    aligned: warnings.length === 0 || Boolean(overridden),
    suggested_design: warnings[0]?.suggested_design ?? null,
  };
}
