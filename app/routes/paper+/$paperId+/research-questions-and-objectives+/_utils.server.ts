import {
  generateAiResearchQuestionAndObjectiveMainResearchQuestion,
  generateAISubResearchQuestionOrObjective,
} from "#app/services/ai.server";
import {
  updatePaperMainResearchQuestion,
  updatePaperSubResearchQuestionOrObjective,
} from "#app/services/paper.server";

export const saveMainResearchQuestion = async ({
  request,
  paperId,
  mainResearchQuestion,
}: {
  request: Request;
  paperId: string;
  mainResearchQuestion: string;
}) => {
  try {
    await updatePaperMainResearchQuestion({
      paperId,
      mainResearchQuestion,
      request,
    });
  } catch (error) {
    console.error("Error saving main research question", error);
    throw error;
  }
};

export const generateMainResearchQuestionAI = async ({
  request,
  paperId,
  ablyEventName,
}: {
  request: Request;
  paperId: string;
  ablyEventName: string;
}) => {
  console.log("Generating main research question AI");
  console.log("Paper ID", paperId);
  console.log("Ably event name", ablyEventName);
  try {
    await generateAiResearchQuestionAndObjectiveMainResearchQuestion({
      request,
      paperId,
      eventName: ablyEventName,
    });
  } catch (error) {
    console.error("Error generating main research question AI", error);
    throw error;
  }
};

export const saveSubResearchQuestionOrObjective = async ({
  request,
  paperId,
  subResearchQuestionId,
  updateData,
}: {
  request: Request;
  paperId: string;
  subResearchQuestionId: string;
  updateData: { question?: string; objective?: string };
}) => {
  console.log("Saving sub research question or objective 🔥");
  console.log("Paper ID", paperId);
  console.log("Sub research question ID", subResearchQuestionId);
  console.log("Update data", updateData);
  try {
    await updatePaperSubResearchQuestionOrObjective({
      paperId,
      subResearchQuestionId,
      updateData,
      request,
    });
  } catch (error) {
    console.log("ERRORRRRR 🔥");
    console.error("Error saving sub research question or objective 🔥", error);
    // throw error;
  }
};

export const generateSubResearchQuestionOrObjectiveAI = async ({
  request,
  paperId,
  subResearchQuestionId,
  ablyEventName,
  aiPreContextText,
  subResearchOrder,
  field,
}: {
  request: Request;
  paperId: string;
  subResearchQuestionId: string;
  ablyEventName: string;
  aiPreContextText?: string;
  subResearchOrder: string;
  field: string;
}) => {
  try {
    await generateAISubResearchQuestionOrObjective({
      request,
      paperId,
      subResearchQuestionId,
      ablyEventName: ablyEventName,
      subResearchOrder,
      field,
      ...(aiPreContextText && { aiPreContextText }),
    });
  } catch (error) {
    console.error(
      "Error generating sub research question or objective AI",
      error
    );
    throw error;
  }
};
