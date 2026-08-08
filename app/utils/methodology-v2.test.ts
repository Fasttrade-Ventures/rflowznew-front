import { describe, expect, it } from "vitest";

import {
  buildMethodologyParagraph,
  isStarterGlueCompatible,
  type MethodologyV2FormValues,
} from "./methodology-v2";

const shortDraftValues: MethodologyV2FormValues = {
  meta: {
    recommended_design_label: "Analisis Fenomenologi Interpretatif (IPA)",
    recommended_data_collection: "Wawancara semi-terstruktur",
    recommended_data_analysis: "siklus analisis IPA",
    sampling: "Pengambilan sampel purposif, 6–10 partisipan",
    recommended_software: "NVivo (rekomendasi alat eksternal)",
  },
  methodology_paragraph: "",
};

describe("buildMethodologyParagraph", () => {
  it("builds Indonesian starter prose for short Prof Z drafts", () => {
    const paragraph = buildMethodologyParagraph(shortDraftValues, "id");
    expect(paragraph).toContain("Penelitian ini mengadopsi");
    expect(paragraph).not.toContain("This study adopts");
    expect(paragraph).not.toContain("Data will be analysed");
    expect(paragraph).toContain("Data akan dianalisis menggunakan");
  });

  it("stitches verbose Prof Z drafts without English glue", () => {
    const verbose: MethodologyV2FormValues = {
      ...shortDraftValues,
      meta: {
        ...shortDraftValues.meta,
        recommended_data_collection:
          "Wawancara semi-struktur mendalam akan menjadi metode utama pengumpulan data. Wawancara ini akan sopan, terbuka, dan fleksibel.",
      },
    };
    const paragraph = buildMethodologyParagraph(verbose, "id");
    expect(paragraph).toContain("Penelitian ini mengadopsi");
    expect(paragraph).toContain("Wawancara semi-struktur mendalam");
    expect(paragraph).not.toContain("This study adopts");
    expect(paragraph).not.toContain("with data collected through");
    expect(paragraph).not.toContain("Data will be analysed using");
  });

  it("keeps English glue for English papers", () => {
    const english: MethodologyV2FormValues = {
      meta: {
        recommended_design_label: "Interpretative Phenomenological Analysis (IPA)",
        recommended_data_collection: "Semi-structured interviews",
        recommended_data_analysis: "IPA analytic cycle",
        sampling: "Purposive sampling, 6–10 participants",
        recommended_software: "NVivo (external tool recommendation)",
      },
      methodology_paragraph: "",
    };
    const paragraph = buildMethodologyParagraph(english, "en");
    expect(paragraph).toContain("This study adopts");
    expect(paragraph).toContain("Data will be analysed using");
  });
});

describe("isStarterGlueCompatible", () => {
  it("rejects multi-sentence draft fragments", () => {
    expect(
      isStarterGlueCompatible(
        "Wawancara semi-struktur. Peneliti akan memulai dengan pertanyaan luas."
      )
    ).toBe(false);
  });
});
