/* eslint-disable no-empty */
"use server";
import Questions from "@/database/question.model";
import Tag from "@/database/tag.model";
import { connectToDataBase } from "../mongoose";
import {
  CreateQuestionParams,
  GetQuestionByIdParams,
  GetQuestionsParams,
  QuestionVoteParams,
} from "./shared.types";
import User from "@/database/user.modal";
import { revalidatePath } from "next/cache";
import { DeleteQuestionParams } from "@/types";
import Answer from "@/database/answer.modal";
import Interaction from "@/database/interaction.model";

export async function getQuestions(params: GetQuestionsParams) {
  try {
    connectToDataBase();

    const questions = await Questions.find({})
      .sort({ _id: -1 })
      .populate({
        path: "tags",
        model: Tag,
      })
      .populate({ path: "author", model: User });

    return { questions };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting questions");
  }
}

export async function createQuestion(params: CreateQuestionParams) {
  try {
    connectToDataBase();
    const { title, tags, content, author, path } = params;

    // create question
    const question = await Questions.create({
      title,
      content,
      author,
    });
    const tagDocuments = [];
    // Create the tags or get them if they already exists
    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        {
          name: { $regex: new RegExp(`^${tag}$`, "i") },
        },
        { $setOnInsert: { name: tag }, $push: { questions: question._id } },
        { upsert: true, new: true },
      );
      tagDocuments.push(existingTag._id);
    }
    await Questions.findByIdAndUpdate(question._id, {
      $push: { tags: { $each: tagDocuments } },
    });
    // create an interaction record for the user asking the question action

    // increment author reputation by 5+ for creating a question

    revalidatePath(path);
  } catch (error) {}
}

export async function getQuestionById(params: GetQuestionByIdParams) {
  try {
    connectToDataBase();
    const { questionId } = params;

    const question = await Questions.findById(questionId)
      .populate({ path: "tags", model: Tag, select: "_id name" })
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      });

    return question;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function upVoteQuestion(params: QuestionVoteParams) {
  try {
    connectToDataBase();
    const { questionId, userId, hasupVoted, hasdownVoted, path } = params;
    let updateQuery = {};
    if (hasupVoted) {
      updateQuery = { $pull: { upvotes: userId } };
    } else if (hasdownVoted) {
      updateQuery = {
        $pull: { downvotes: userId },
        $push: { upvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { upvotes: userId } };
    }

    const questions = await Questions.findByIdAndUpdate(
      questionId,
      updateQuery,
      {
        new: true,
      },
    );
    if (!questions) {
      throw new Error("Question not found");
    }

    // increment author reputation
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error upvoting question");
  }
}

export async function downVoteQuestion(params: QuestionVoteParams) {
  try {
    connectToDataBase();
    const { questionId, userId, hasupVoted, hasdownVoted, path } = params;
    let updateQuery = {};
    if (hasdownVoted) {
      updateQuery = { $pull: { downvotes: userId } };
    } else if (hasupVoted) {
      updateQuery = {
        $pull: { upvotes: userId },
        $push: { downvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { downvotes: userId } };
    }

    const questions = await Questions.findByIdAndUpdate(
      questionId,
      updateQuery,
      {
        new: true,
      },
    );
    if (!questions) {
      throw new Error("Question not found");
    }

    // increment author reputation
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error upvoting question");
  }
}

export async function deleteQuestion(params: DeleteQuestionParams) {
  try {
    connectToDataBase();
    const { questionId, path } = params;
    await Questions.deleteOne({ _id: questionId });
    await Answer.deleteMany({ question: questionId });
    await Interaction.deleteMany({ question: questionId });
    await Tag.updateMany(
      { questions: questionId },
      { $pull: { questions: questionId } },
    );
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error deleting question");
  }
}
