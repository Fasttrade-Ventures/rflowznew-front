import { describe, expect, it } from "vitest";

import {
  buildDraftPhilosophy,
  mapParadigm,
  writePhilosophyChoice,
  type PhilosophyAnswers,
} from "./philosophy-dialogue";

const interpretivistAnswers: PhilosophyAnswers = {
  ontology_answers: writePhilosophyChoice({
    choice: "b",
    text: "Reality can be multiple and socially constructed",
    summary: "multiple/constructed",
  }),
  epistemology_answers: writePhilosophyChoice({
    choice: "b",
    text: "Knowledge is co-created with participants",
    summary: "co-create",
  }),
  axiology_answers: writePhilosophyChoice({
    choice: "b",
    text: "Researcher values and positionality should be acknowledged",
    summary: "values acknowledged",
  }),
  paradigm: "",
  draft_philosophy: "",
};

describe("philosophy dialogue", () => {
  it("maps interpretivist sample answers to Interpretivism · Constructivism", () => {
    const mapped = mapParadigm(interpretivistAnswers);
    expect(mapped.paradigm).toBe("Interpretivism · Constructivism");
    expect(mapped.summaryLine).toBe(
      "multiple/constructed · co-create · values acknowledged"
    );
  });

  it("builds a draft philosophy paragraph from sample answers", () => {
    const draft = buildDraftPhilosophy(
      { ...interpretivistAnswers, paradigm: "Interpretivism · Constructivism" },
      "sense of community in high-rise public housing"
    );
    expect(draft).toContain("interpretivist–constructivist");
    expect(draft).toContain("socially constructed");
    expect(draft).toContain("co-created");
    expect(draft).toContain("positionality");
  });
});
