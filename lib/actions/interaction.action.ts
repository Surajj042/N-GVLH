"use server";

import Question from "@/database/question.modal";
import { connectToDatabase } from "../mongoose";
import { ViewQuestionParams } from "./shared.types";
import Interaction from "@/database/interaction.modal";

export async function viewQuestion(params: ViewQuestionParams) {
  try {
    await connectToDatabase();

    const { questionId, userId } = params;

    // If no userId (anonymous / not logged in), increment views directly without
    // creating an Interaction. A future improvement could store a hashed IP or
    // anon cookie to deduplicate, but we avoid double-counting via Interaction
    // only for authenticated users to keep logic simple and avoid cookie handling.
    if (!userId) {
      await Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } });
      return;
    }

    const existingInteraction = await Interaction.findOne({
      user: userId,
      action: "view",
      question: questionId,
    });

    if (existingInteraction)
      // User has already viewed this question.
      return;

    // Update view count for the question
    await Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } });

    // Create interaction
    await Interaction.create({
      user: userId,
      action: "view",
      question: questionId,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
