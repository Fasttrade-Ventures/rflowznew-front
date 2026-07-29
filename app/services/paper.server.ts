import { Cite } from "#app/components/ui/citation/MendeleyCiteForm";
import customFetch from "#app/utils/customFetch";

const createNewPaper = async ({
  paper,
  request,
}: {
  paper: {
    tangibleOutput: {
      type: string;
      description?: string;
    };
    method: string;
    context: string;
    title?: string;
    brief?: string;
    authors?: Array<{
      first_name?: string;
      last_name?: string;
    }>;
    keywords?: string[];
    affiliations?: Array<{
      name?: string;
      location?: string;
      authors?: Array<{
        first_name?: string;
        last_name?: string;
      }>;
    }>;
    language?: "en" | "id" | "ar" | "ms";
    meta?: Record<string, unknown>;
  };
  request: Request;
}) => {
  const newPaper = {
    ...paper,
    tangible_output:
      paper.tangibleOutput.type === "Others"
        ? paper.tangibleOutput.description
        : paper.tangibleOutput.type,
  };
  const res = await customFetch<{ paper: { id: number } }>({
    request,
    url: "/api/papers",
    method: "post",
    data: JSON.stringify(newPaper),
  });

  return res;
};

const updatePaper = async ({
  paperId,
  paper,
  request,
}: {
  paperId: string;
  paper: {
    title?: string;
    brief?: string;
    authors?: Array<{
      first_name?: string;
      last_name?: string;
    }>;
    keywords?: string[];
    affiliations?: Array<{
      name?: string;
      location?: string;
      authors?: Array<{
        first_name?: string;
        last_name?: string;
      }>;
    }>;
    language?: "en" | "id" | "ar" | "ms";
  };
  request: Request;
}) => {
  await customFetch<{ paper: { id: number } }>({
    request,
    url: `/api/papers/${paperId}`,
    method: "put",
    data: JSON.stringify(paper),
  });
};

export type PaperResponse = {
  message: string;
  paper: {
    id: string;
    tangible_output: string;
    title: string;
    authors: Array<{
      first_name: string;
      last_name: string;
    }>;
    method: "Qualitative" | "Quantitative" | "Mixed";
    context: string;
    keywords: string[];
    affiliations: Array<{
      name: string;
      location: string;
      authors: Array<{
        first_name: string;
        last_name: string;
      }>;
    }>;
    language: "en" | "id" | "ar" | "ms";
    user_id: number;
    meta?: {
      purpose?: string;
      rqCount?: number;
      engineRoute?: string[];
      simulation_v2?: boolean;
    } | null;
    created_at: string;
    updated_at: string;
  };
};

const getPaper = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<PaperResponse>({
    request,
    url: `/api/papers/${paperId}`,
    method: "get",
  });

  return res;
};

const getPapers = async ({ request }: { request: Request }) => {
  const res = await customFetch<{
    papers: {
      id: string;
      title: string;
      overall_progress: number;
      created_at: string;
    }[];
  }>({
    request,
    url: "/api/papers",
    method: "get",
  });

  return res;
};

const getPaperIntroduction = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    introduction: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/introductions`,
    method: "get",
  });

  return res;
};

const createNewIntroduction = async ({
  paperId,
  introduction,
  request,
}: {
  paperId: string;
  introduction: { body: string };
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/introductions`,
    method: "post",
    data: JSON.stringify({
      body: introduction.body,
    }),
  });

  return res;
};

const updateIntroduction = async ({
  paperId,
  introduction,
  request,
}: {
  paperId: string;
  introduction: { body: string };
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/introductions`,
    method: "put",
    data: JSON.stringify({
      body: introduction.body,
    }),
  });

  return res;
};

const getPaperProblemStatement = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    problem_statement: {
      completion_percentage: number;
      motivational_problem: string;
      gap_in_practice: string;
      research_problem: string;
      gap_in_research: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/problem-statements`,
    method: "get",
  });

  return res;
};

const createOrUpdateProblemStatement = async ({
  paperId,
  problemStatement,
  request,
}: {
  paperId: string;
  problemStatement: {
    motivational_problem?: string;
    gap_in_practice?: string;
    research_problem?: string;
    gap_in_research?: string;
  };
  request: Request;
}) => {
  const data: Record<string, string> = {};

  if (problemStatement.motivational_problem) {
    data.motivational_problem = problemStatement.motivational_problem;
  }
  if (problemStatement.gap_in_practice) {
    data.gap_in_practice = problemStatement.gap_in_practice;
  }
  if (problemStatement.research_problem) {
    data.research_problem = problemStatement.research_problem;
  }
  if (problemStatement.gap_in_research) {
    data.gap_in_research = problemStatement.gap_in_research;
  }

  const res = await customFetch<{
    success: boolean;
    message: string;
    problem_statement: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/problem-statements`,
    method: "post",
    data: JSON.stringify(data),
  });

  return res;
};

const getPaperPointOfDeparture = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    point_of_departure: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/point-of-departure`,
    method: "get",
  });

  return res;
};

const createOrUpdatePointOfDeparture = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    point_of_departure: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/point-of-departure`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperProgress = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    overall_percentage?: number;
    simulation_v2?: boolean;
    progress: Record<string, { completion_percentage: number }>;
  }>({
    request,
    url: `/api/papers/${paperId}/progress`,
    method: "get",
  });

  return res;
};

const getPaperMethodology = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    methodology: {
      completion_percentage: number;
      research_design: string;
      data_collection_methods: string;
      analysis_techniques: string;
      software_and_tools: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/methodologies`,
    method: "get",
  });

  return res;
};

const createOrUpdateMethodology = async ({
  paperId,
  methodology,
  request,
}: {
  paperId: string;
  methodology: {
    research_design?: string;
    data_collection_methods?: string;
    analysis_techniques?: string;
    software_and_tools?: string;
    meta?: Record<string, unknown>;
  };
  request: Request;
}) => {
  const data: Record<string, unknown> = {};

  if (methodology.research_design !== undefined) {
    data.research_design = methodology.research_design;
  }
  if (methodology.data_collection_methods !== undefined) {
    data.data_collection_methods = methodology.data_collection_methods;
  }
  if (methodology.analysis_techniques !== undefined) {
    data.analysis_techniques = methodology.analysis_techniques;
  }
  if (methodology.software_and_tools !== undefined) {
    data.software_and_tools = methodology.software_and_tools;
  }
  if (methodology.meta !== undefined) {
    data.meta = methodology.meta;
  }

  const res = await customFetch<{
    success: boolean;
    message: string;
    methodology: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/methodologies`,
    method: "put",
    data: JSON.stringify(data),
  });

  return res;
};

const getPaperExpectedOutput = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    expected_output: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/expected-output`,
    method: "get",
  });

  return res;
};

const createOrUpdateExpectedOutput = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    expected_output: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/expected-output`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperConclusion = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    conclusion: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/conclusion`,
    method: "get",
  });

  return res;
};

const createOrUpdateConclusion = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    conclusion: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/conclusion`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperResearchSignificant = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    research_significant: {
      completion_percentage: number;
      practical_contribution: string;
      research_contribution: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/research-significant`,
    method: "get",
  });

  return res;
};

const createOrUpdateResearchSignificant = async ({
  paperId,
  research_significant,
  request,
}: {
  paperId: string;
  research_significant: {
    practical_contribution?: string;
    research_contribution?: string;
  };
  request: Request;
}) => {
  const data: Record<string, string> = {};

  if (research_significant.practical_contribution) {
    data.practical_contribution = research_significant.practical_contribution;
  }
  if (research_significant.research_contribution) {
    data.research_contribution = research_significant.research_contribution;
  }

  const res = await customFetch<{
    success: boolean;
    message: string;
    research_significant: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/research-significant`,
    method: "put",
    data: JSON.stringify(data),
  });

  return res;
};

const getPaperAbstractSec = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    abstract_sec: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/abstract`,
    method: "get",
  });

  return res;
};

const createOrUpdateAbstractSec = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    abstract_sec: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/abstract`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperResearchQuestionsAndObjectives = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    research_question_and_objective: {
      id: number;
      main_research_question: string | null;
      completion_percentage: number;
      paper_id: string;
      created_at: string;
      updated_at: string;
      sub_research_question_and_objectives: Array<{
        id: number;
        question: string;
        objective: string;
        order: number;
        research_question_and_objective_id: number;
        created_at: string;
        updated_at: string;
      }>;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/research-questions-and-objectives`,
    method: "get",
  });

  return res;
};

const updatePaperMainResearchQuestion = async ({
  paperId,
  mainResearchQuestion,
  request,
}: {
  paperId: string;
  mainResearchQuestion: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/research-questions-and-objectives`,
    method: "put",
    data: JSON.stringify({ main_research_question: mainResearchQuestion }),
  });

  return res;
};

const addSubResearchQuestionAndObjective = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/research-questions-and-objectives/sub/new`,
    method: "post",
  });

  return res;
};

const deleteSubResearchQuestionAndObjective = async ({
  subResearchQuestionId,
  paperId,
  request,
}: {
  subResearchQuestionId: string;
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/research-questions-and-objectives/sub/${subResearchQuestionId}`,
    method: "delete",
  });

  return res;
};

const updatePaperSubResearchQuestionOrObjective = async ({
  paperId,
  subResearchQuestionId,
  updateData,
  request,
}: {
  paperId: string;
  subResearchQuestionId: string;
  updateData: { question?: string; objective?: string };
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/research-questions-and-objectives/sub/${subResearchQuestionId}`,
    method: "put",
    data: JSON.stringify(updateData),
  });

  return res;
};

const getPaperExpertReview = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    expert_review: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/expert-review`,
    method: "get",
  });

  return res;
};

const createOrUpdateExpertReview = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    expert_review: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/expert-review`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperExperimentAnalysis = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    experiment_analysis: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/experiment-analysis`,
    method: "get",
  });

  return res;
};

const createOrUpdateExperimentAnalysis = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    experiment_analysis: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/experiment-analysis`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperLiteratureReview = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    literature_review: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/literature-review`,
    method: "get",
  });

  return res;
};

const createOrUpdateLiteratureReview = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    literature_review: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/literature-review`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

export interface Citation {
  id?: string;
  statement_text: string;
  cites: Cite[];
  section:
    | "background_study"
    | "motivational_problem"
    | "research_problem"
    | "literature_review"
    | "methodology";
  topic?: string;
}

export interface ExtendedCitation extends Omit<Citation, "id"> {
  id: string;
  paper_id: string;
  created_at: string;
  updated_at: string;
}

const addCitation = async ({
  paperId,
  citations,
  request,
}: {
  paperId: string;
  citations: Array<Citation>;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    citations: {
      statement_text: string;
    }[];
  }>({
    request,
    url: `/api/papers/${paperId}/citations`,
    method: "post",
    data: JSON.stringify({ citations }),
  });

  return res;
};

const getPaperCitationsBySection = async ({
  paperId,
  section,
  request,
}: {
  paperId: string;
  request: Request;
  section:
    | "background_study"
    | "motivational_problem"
    | "research_problem"
    | "literature_review"
    | "methodology";
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    citations: ExtendedCitation[];
  }>({
    request,
    url: `/api/papers/${paperId}/citations/section?section=${section}`,
    method: "get",
  });

  return res;
};

const removeCitationById = async ({
  citationId,
  paperId,
  request,
}: {
  citationId: string;
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/citations/${citationId}`,
    method: "delete",
  });

  return res;
};

const getPaperBibliography = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    bibliography: string[];
  }>({
    request,
    url: `/api/papers/${paperId}/bibliography`,
    method: "get",
  });

  return res;
};

export interface CitationVerificationStatus {
  marker: string;
  span: string;
  status: "matched" | "unknown_source" | "unsupported";
  openalex_id?: string;
  note?: string;
}

export interface CitationVerificationResult {
  citations: CitationVerificationStatus[];
  uncited_sources: string[];
  summary: {
    total: number;
    matched: number;
    unknown: number;
    unsupported: number;
  };
}

const getCitationVerifications = async ({
  paperId,
  section,
  request,
}: {
  paperId: string;
  section: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    status: "not_started" | "pending" | "completed" | "failed";
    results?: CitationVerificationResult;
    verified_at?: string | null;
  }>({
    request,
    url: `/api/papers/${paperId}/citation-verifications?section=${section}`,
    method: "get",
  });

  return res;
};

const generateDocuments = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  await customFetch({
    request,
    url: `/api/papers/${paperId}/generate-docx`,
    method: "get",
  });
};

export interface GeneratedDocument {
  id: number;
  docx_url: string;
  pdf_url: string | null;
  pptx_url: string | null;
  docx_generating_status: "completed" | "pending" | "failed";
  pdf_generating_status: "completed" | "pending" | "failed";
  pptx_generating_status: "completed" | "pending" | "failed" | null;
  created_at: string;
}

const getPaperGeneratedDocuments = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    generatedDocuments: GeneratedDocument[];
  }>({
    request,
    url: `/api/papers/${paperId}/generated-documents`,
    method: "get",
  });

  return res;
};

const createOrUpdateSolvingTheProblem = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
  }>({
    request,
    url: `/api/papers/${paperId}/solving-the-problem`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperSolvingTheProblem = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    solving_the_problem: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    } | null;
  }>({
    request,
    url: `/api/papers/${paperId}/solving-the-problem`,
    method: "get",
  });

  return res;
};

const getPaperReliability = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    reliability: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
    paper_method: "Qualitative" | "Quantitative" | "Mixed";
  }>({
    request,
    url: `/api/papers/${paperId}/reliability`,
    method: "get",
  });

  return res;
};

const createOrUpdateReliability = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    reliability: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/reliability`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

const getPaperTrustworthiness = async ({
  paperId,
  request,
}: {
  paperId: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    trustworthiness: {
      body: string;
      paper_id: string;
      created_at: string;
      updated_at: string;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/trustworthiness`,
    method: "get",
  });

  return res;
};

const createOrUpdateTrustworthiness = async ({
  paperId,
  body,
  request,
}: {
  paperId: string;
  body: string;
  request: Request;
}) => {
  const res = await customFetch<{
    success: boolean;
    message: string;
    trustworthiness: {
      completion_percentage: number;
    };
  }>({
    request,
    url: `/api/papers/${paperId}/trustworthiness`,
    method: "put",
    data: JSON.stringify({ body }),
  });

  return res;
};

export {
  createNewPaper,
  updatePaper,
  getPaper,
  getPapers,
  getPaperIntroduction,
  createNewIntroduction,
  updateIntroduction,
  getPaperProblemStatement,
  createOrUpdateProblemStatement,
  getPaperPointOfDeparture,
  createOrUpdatePointOfDeparture,
  getPaperProgress,
  getPaperMethodology,
  createOrUpdateMethodology,
  getPaperExpectedOutput,
  createOrUpdateExpectedOutput,
  getPaperConclusion,
  createOrUpdateConclusion,
  getPaperResearchSignificant,
  createOrUpdateResearchSignificant,
  getPaperAbstractSec,
  createOrUpdateAbstractSec,
  getPaperResearchQuestionsAndObjectives,
  updatePaperMainResearchQuestion,
  addSubResearchQuestionAndObjective,
  updatePaperSubResearchQuestionOrObjective,
  deleteSubResearchQuestionAndObjective,
  getPaperExpertReview,
  createOrUpdateExpertReview,
  getPaperExperimentAnalysis,
  createOrUpdateExperimentAnalysis,
  getPaperLiteratureReview,
  createOrUpdateLiteratureReview,
  addCitation,
  getPaperCitationsBySection,
  removeCitationById,
  getPaperBibliography,
  getCitationVerifications,
  generateDocuments,
  getPaperGeneratedDocuments,
  createOrUpdateSolvingTheProblem,
  getPaperSolvingTheProblem,
  getPaperReliability,
  createOrUpdateReliability,
  getPaperTrustworthiness,
  createOrUpdateTrustworthiness,
};
