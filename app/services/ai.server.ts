import customFetch from "#app/utils/customFetch";

const generateAiIntroduction = async ({
  paperId,
  ablyEventName,
  request,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-introduction",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiTitle = async ({
  request,
  keywords,
  language = "en",
}: {
  request: Request;
  keywords: string;
  language?: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-title",
    method: "post",
    data: JSON.stringify({
      keywords: keywords,
      language: language,
    }),
  });

  return res;
};

const generateAiProblemStatement = async ({
  request,
  paperId,
  field,
  ablyEventName,
}: {
  request: Request;
  paperId: string;
  field: string;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-problem-statement",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      column: field,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiPoD = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-point-of-departure",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiMethodology = async ({
  request,
  paperId,
  field,
  ablyEventName,
}: {
  request: Request;
  paperId: string;
  field: string;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-methodology",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      field,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiExpectedOutput = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-expected-output",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
    }),
  });

  return res;
};

const generateAiConclusion = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-conclusion",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiResearchSignificant = async ({
  request,
  paperId,
  field,
  ablyEventName,
}: {
  request: Request;
  paperId: string;
  field: string;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-research-significant",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      column: field,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiAbstractSec = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-abstract",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiResearchQuestionAndObjectiveMainResearchQuestion = async ({
  request,
  paperId,
  eventName,
}: {
  request: Request;
  paperId: string;
  eventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-research-question-and-objective-main-research-question",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: eventName,
    }),
  });

  return res;
};

const generateAISubResearchQuestionOrObjective = async ({
  request,
  paperId,
  subResearchQuestionId,
  subResearchOrder,
  ablyEventName,
  aiPreContextText,
  field,
}: {
  request: Request;
  paperId: string;
  subResearchQuestionId: string;
  subResearchOrder: string;
  ablyEventName: string;
  aiPreContextText?: string;
  field: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-subresearch-question-or-objective",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      sub_research_id: subResearchQuestionId,
      ably_event_name: ablyEventName,
      sub_research_order: subResearchOrder,
      field: field,
      ...(aiPreContextText && { ai_precontext_text: aiPreContextText }),
    }),
  });

  return res;
};

const generateAiExperimentAnalysis = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-experiment-analysis",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiExpertReview = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-expert-review",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiLiteratureReview = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-literature-review",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiSolvingTheProblem = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-solving-the-problem",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

const generateAiReliability = async ({
  paperId,
  request,
  ablyEventName,
}: {
  paperId: string;
  request: Request;
  ablyEventName: string;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    response: string;
  }>({
    request,
    url: "/api/ai/generate-reliability",
    method: "post",
    data: JSON.stringify({
      paper_id: paperId,
      ably_event_name: ablyEventName,
    }),
  });

  return res;
};

export {
  generateAiIntroduction,
  generateAiTitle,
  generateAiProblemStatement,
  generateAiPoD,
  generateAiMethodology,
  generateAiExpectedOutput,
  generateAiConclusion,
  generateAiResearchSignificant,
  generateAiAbstractSec,
  generateAiResearchQuestionAndObjectiveMainResearchQuestion,
  generateAISubResearchQuestionOrObjective,
  generateAiExpertReview,
  generateAiLiteratureReview,
  generateAiExperimentAnalysis,
  generateAiSolvingTheProblem,
  generateAiReliability,
};
