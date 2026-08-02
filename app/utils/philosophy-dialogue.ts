export type PhilosophyStepKey = "ontology" | "epistemology" | "axiology";

export type PhilosophyChoice = {
  choice: "a" | "b";
  text: string;
  summary: string;
};

export type PhilosophyAnswers = {
  ontology_answers: Record<string, string> | null;
  epistemology_answers: Record<string, string> | null;
  axiology_answers: Record<string, string> | null;
  paradigm: string;
  draft_philosophy: string;
};

export type PhilosophyDialogueStep = {
  key: PhilosophyStepKey;
  label: string;
  stepLabel: string;
  question: string;
  options: Array<{ key: "a" | "b"; text: string; summary: string }>;
};

export const PHILOSOPHY_DIALOGUE_STEPS: PhilosophyDialogueStep[] = [
  {
    key: "ontology",
    label: "Ontology",
    stepLabel: "Step 1 — Ontology",
    question: "What is the nature of reality in your study?",
    options: [
      {
        key: "a",
        text: "Reality is single and fixed — the same for everyone",
        summary: "single/fixed",
      },
      {
        key: "b",
        text: "Reality can be multiple and socially constructed",
        summary: "multiple/constructed",
      },
    ],
  },
  {
    key: "epistemology",
    label: "Epistemology",
    stepLabel: "Step 2 — Epistemology",
    question: "How is knowledge produced in your study?",
    options: [
      {
        key: "a",
        text: "Knowledge is discovered by the researcher from objective facts",
        summary: "discovered",
      },
      {
        key: "b",
        text: "Knowledge is co-created with participants",
        summary: "co-create",
      },
    ],
  },
  {
    key: "axiology",
    label: "Axiology",
    stepLabel: "Step 3 — Axiology",
    question: "What role should your own values play in this research?",
    options: [
      {
        key: "a",
        text: "Values should be set aside — stay neutral and objective",
        summary: "values neutral",
      },
      {
        key: "b",
        text: "Researcher values and positionality should be acknowledged",
        summary: "values acknowledged",
      },
    ],
  },
];

export function readPhilosophyChoice(
  answers: Record<string, string> | null | undefined
): PhilosophyChoice | null {
  if (!answers?.choice || !answers?.text) return null;
  return {
    choice: answers.choice as "a" | "b",
    text: answers.text,
    summary: answers.summary ?? "",
  };
}

export function writePhilosophyChoice(choice: PhilosophyChoice): Record<string, string> {
  return {
    choice: choice.choice,
    text: choice.text,
    summary: choice.summary,
  };
}

export function completedDialogueCount(answers: PhilosophyAnswers): number {
  return PHILOSOPHY_DIALOGUE_STEPS.filter((step) =>
    readPhilosophyChoice(answers[`${step.key}_answers` as keyof PhilosophyAnswers] as Record<string, string>)
  ).length;
}

export function mapParadigm(answers: PhilosophyAnswers): {
  paradigm: string;
  summaryLine: string;
  profZNote: string;
} {
  const choices = PHILOSOPHY_DIALOGUE_STEPS.map((step) =>
    readPhilosophyChoice(
      answers[`${step.key}_answers` as keyof PhilosophyAnswers] as Record<string, string>
    )
  ).filter(Boolean) as PhilosophyChoice[];

  const summaryLine = choices.map((c) => c.summary).join(" · ");
  const interpretivistSignals = choices.filter(
    (c) =>
      c.summary === "multiple/constructed" ||
      c.summary === "co-create" ||
      c.summary === "values acknowledged"
  ).length;

  if (interpretivistSignals >= 2) {
    return {
      paradigm: "Interpretivism · Constructivism",
      summaryLine,
      profZNote:
        "Your answers point to interpretivism — you see reality as constructed and knowledge as co-created. That fits a qualitative study of lived experience. Next we'll align your methodology to this.",
    };
  }

  if (choices.some((c) => c.choice === "b")) {
    return {
      paradigm: "Pragmatism · Mixed methods",
      summaryLine,
      profZNote:
        "Your answers mix positions — that's common in applied research. Be explicit about which assumptions guide each part of your design.",
    };
  }

  return {
    paradigm: "Positivism · Post-positivism",
    summaryLine,
    profZNote:
      "Your answers lean positivist — reality is treated as measurable and knowledge is discovered objectively. Quantitative or structured designs will fit best.",
  };
}

/**
 * Returns fully-filled qualitative (option B) answers, ready to be used as
 * a default PhilosophyAnswers state so users never see an empty dialogue.
 */
export function buildQualitativePreset(existingDraft = ""): PhilosophyAnswers {
  const preset: PhilosophyAnswers = {
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
    draft_philosophy: existingDraft,
  };
  const mapped = mapParadigm(preset);
  return { ...preset, paradigm: mapped.paradigm };
}

export function buildDraftPhilosophy(
  answers: PhilosophyAnswers,
  topicHint = "this study"
): string {
  const ontology = readPhilosophyChoice(answers.ontology_answers);
  const epistemology = readPhilosophyChoice(answers.epistemology_answers);
  const axiology = readPhilosophyChoice(answers.axiology_answers);
  const { paradigm } = mapParadigm(answers);

  if (!ontology || !epistemology || !axiology) {
    return "";
  }

  const opening =
    paradigm.includes("Interpretivism")
      ? "This study adopts an interpretivist–constructivist philosophy."
      : paradigm.includes("Positivism")
        ? "This study adopts a positivist–post-positivist philosophy."
        : "This study adopts a pragmatic philosophy.";

  const ontologySentence =
    ontology.summary === "multiple/constructed"
      ? `Reality regarding ${topicHint} is understood as multiple and socially constructed.`
      : `Reality regarding ${topicHint} is understood as an objective phenomenon that can be measured.`;

  const epistemologySentence =
    epistemology.summary === "co-create"
      ? "Knowledge will be co-created with participants through their lived experiences."
      : "Knowledge will be discovered through systematic observation and analysis.";

  const axiologySentence =
    axiology.summary === "values acknowledged"
      ? "The researcher acknowledges their positionality and values in shaping inquiry and interpretation."
      : "The researcher aims to minimise personal bias and maintain objectivity throughout the inquiry.";

  return [opening, ontologySentence, epistemologySentence, axiologySentence].join(
    " "
  );
}
