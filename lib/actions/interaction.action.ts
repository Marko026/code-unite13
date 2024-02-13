"use server";

import Questions from "@/database/question.model";
import { connectToDataBase } from "../mongoose";
import { ViewQuestionParams } from "./shared.types";
import Interaction from "@/database/interaction.model";

export async function viewQuestion(params: ViewQuestionParams) {
  try {
    await connectToDataBase();
    const { questionId, userId } = params;

    // update view count for the question by 1
    await Questions.findByIdAndUpdate(questionId, {
      $inc: { views: 1 },
    });
    // Check if user has viewed this question before
    if (userId) {
      const existingInteraction = await Interaction.findOne({
        user: userId,
        action: "view",
        question: questionId,
      });
      if (existingInteraction)
        return console.log("User has viewed this question before");

      // create new interaction
      await Interaction.create({
        user: userId,
        action: "view",
        question: questionId,
      });
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error connecting to database");
  }
}
