import {
  addSubResearchQuestionAndObjective,
  getPaperResearchQuestionsAndObjectives,
  updatePaperSubResearchQuestionOrObjective,
} from "#app/services/paper.server";
import {
  effectiveRqCount,
  type PaperSimulationMeta,
  type RqFormValues,
} from "#app/utils/research-questions-v2";
import { saveMainResearchQuestion } from "./_utils.server";

export async function ensureRqSubSlots({
  paperId,
  request,
  meta,
}: {
  paperId: string;
  request: Request;
  meta?: PaperSimulationMeta | null;
}) {
  const rqCount = effectiveRqCount(meta);
  const neededSubs = Math.max(0, rqCount - 1);

  let res = await getPaperResearchQuestionsAndObjectives({ paperId, request });
  let subs =
    res.data?.research_question_and_objective
      ?.sub_research_question_and_objectives ?? [];

  while (subs.length < neededSubs) {
    await addSubResearchQuestionAndObjective({ paperId, request });
    res = await getPaperResearchQuestionsAndObjectives({ paperId, request });
    subs =
      res.data?.research_question_and_objective
        ?.sub_research_question_and_objectives ?? [];
  }

  return {
    researchQuestionAndObjective: res.data?.research_question_and_objective,
    rqCount,
  };
}

export function toRqFormValues(
  researchQuestionAndObjective?: {
    main_research_question: string | null;
    sub_research_question_and_objectives: Array<{
      id: number;
      question: string;
      order: number;
    }>;
  } | null
): RqFormValues {
  return {
    main: researchQuestionAndObjective?.main_research_question ?? "",
    subs: (researchQuestionAndObjective?.sub_research_question_and_objectives ??
      []
    )
      .map((sub) => ({
        id: sub.id,
        question: sub.question ?? "",
        order: sub.order,
      }))
      .sort((a, b) => a.order - b.order),
  };
}

export async function saveAllResearchQuestionsV2({
  request,
  paperId,
  mainResearchQuestion,
  subs,
}: {
  request: Request;
  paperId: string;
  mainResearchQuestion: string;
  subs: Array<{ id: number; question: string }>;
}) {
  await saveMainResearchQuestion({
    request,
    paperId,
    mainResearchQuestion,
  });

  for (const sub of subs) {
    await updatePaperSubResearchQuestionOrObjective({
      request,
      paperId,
      subResearchQuestionId: String(sub.id),
      updateData: {
        question: sub.question,
        objective: sub.question,
      },
    });
  }
}
