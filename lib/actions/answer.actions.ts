"use server";
import Answer from "../../database/answer.modal";
import { connectToDataBase } from "../mongoose";
import {
  AnswerVoteParams,
  CreateAnswerParams,
  DeleteAnswerParams,
  GetAnswersParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import Questions from "../../database/question.model";
import Interaction from "@/database/interaction.model";

export async function createAnswer(params: CreateAnswerParams) {
  if (!params.author || !params.question || !params.content) {
    throw new Error("Invalid request");
  }

  try {
    connectToDataBase();
    const { path, author, question, content } = params;

    const newAnswer = await Answer.create({
      author,
      question,
      content,
    });
    // add the answer to question answers array and save

    await Questions.findByIdAndUpdate(question, {
      $push: { answers: newAnswer._id },
    });

    // TODO : Add interaction
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error creating answer");
  }
}

export async function getAnswers(params: GetAnswersParams) {
  try {
    connectToDataBase();
    const { questionId, sortBy, page = 1, pageSize = 2 } = params;
    const skipAmount = (page - 1) * pageSize;
    let sortOptions = {};
    switch (sortBy) {
      case "highestUpvotes":
        sortOptions = { upvotes: -1 };
        break;
      case "lowestUpvotes":
        sortOptions = { upvotes: 1 };
        break;
      case "recent":
        sortOptions = { createdAt: -1 };
        break;
      case "old":
        sortOptions = { createdAt: 1 };
        break;
      default:
        break;
    }
    const answers = await Answer.find({ question: questionId })
      .populate("author", "_id clerkId name picture")
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    const totalAnswers = await Answer.countDocuments({ question: questionId });
    const isNext = totalAnswers > page * pageSize;
    return { answers, isNext };
  } catch (error) {
    console.log(error);
  }
}
export async function upVoteAnswer(params: AnswerVoteParams) {
  try {
    connectToDataBase();
    const { answerId, userId, hasupVoted, hasdownVoted, path } = params;
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

    const answer = await Answer.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });
    if (!answer) {
      throw new Error("Answer not found");
    }
    // increment author reputation
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error upvoting question");
  }
}

export async function downVoteAnswer(params: AnswerVoteParams) {
  try {
    connectToDataBase();
    const { answerId, userId, hasupVoted, hasdownVoted, path } = params;
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

    const answer = await Answer.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });
    if (!answer) {
      throw new Error("Answer not found");
    }

    // increment author reputation
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error upvoting question");
  }
}
export async function deleteAnswer(params: DeleteAnswerParams) {
  try {
    connectToDataBase();
    const { answerId, path } = params;
    const answer = await Answer.findById(answerId);

    if (!answer) throw new Error("Answer not found");

    await answer.deleteOne({ _id: answerId });
    await Questions.updateMany(
      { _id: answer.question },
      { $pull: { answers: answerId } },
    );
    await Interaction.deleteMany({ answer: answerId });
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error deleting question");
  }
}
