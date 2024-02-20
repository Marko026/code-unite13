/* eslint-disable no-empty */
"use server";
import Questions from "@/database/question.model";
import Tag from "@/database/tag.model";
import { connectToDataBase } from "../mongoose";
import {
  CreateQuestionParams,
  EditQuestionParams,
  GetQuestionByIdParams,
  GetQuestionsParams,
  QuestionVoteParams,
} from "./shared.types";
import User from "@/database/user.modal";
import { DeleteQuestionParams } from "@/types";
import { revalidatePath } from "next/cache";
import Answer from "@/database/answer.modal";
import Interaction from "@/database/interaction.model";
import { FilterQuery } from "mongoose";

export async function getQuestions(params: GetQuestionsParams) {
  try {
    connectToDataBase();
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;
    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<typeof Questions> = {};

    if (searchQuery) {
      query.$or = [
        { title: { $regex: new RegExp(searchQuery, "i") } },
        { content: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }
    let sortOptions = {};
    switch (filter) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "unanswered":
        query.answers = { $size: 0 };
        break;
      case "frequent":
        sortOptions = { views: -1 };
        break;
      default:
        break;
    }

    const questions = await Questions.find(query)
      .populate({
        path: "tags",
        model: Tag,
      })
      .populate({ path: "author", model: User })
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    const totalQuestions = await Questions.countDocuments(query);
    const isNext = totalQuestions > skipAmount + questions.length;

    return { questions, isNext };
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
    await Interaction.create({
      user: author,
      action: "ask_question",
      question: question._id,
      tags: tagDocuments,
    });
    // increment author reputation by 5+ for creating a question
    await User.findByIdAndUpdate(author, { $inc: { reputation: 5 } });

    revalidatePath(path);
  } catch (error) {}
}

export async function getQuestionById(params: GetQuestionByIdParams) {
  try {
    connectToDataBase();
    const { questionId } = params;
    let decodedId = decodeURIComponent(questionId);
    decodedId = decodedId.replace(/"/g, "");

    const question = await Questions.findById(decodedId)
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
    await User.findByIdAndUpdate(userId, {
      $inc: { reputation: hasupVoted ? -1 : 1 },
    });

    await User.findByIdAndUpdate(questions.author, {
      $inc: { reputation: hasupVoted ? -10 : 10 },
    });
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

    // decrement author reputation
    await User.findByIdAndUpdate(userId, {
      $inc: { reputation: hasdownVoted ? 1 : -1 },
    });
    await User.findByIdAndUpdate(questions.author, {
      $inc: { reputation: hasdownVoted ? 10 : -10 },
    });

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

export async function editQuestion(params: EditQuestionParams) {
  try {
    connectToDataBase();
    const { questionId, title, content, path } = params;
    const question = await Questions.findById(questionId).populate("tags");
    if (!question) {
      throw new Error("Question not found");
    }
    question.title = title;
    question.content = content;

    await question.save();
    revalidatePath(path);
  } catch (error) {
    throw new Error("Error editing question");
  }
}

export async function getHotQuestions() {
  try {
    connectToDataBase();
    const hotQuestions = await Questions.find({})
      .sort({ views: -1, upvotes: -1 })
      .limit(5)
      .populate({ path: "tags", model: Tag });
    return hotQuestions;
  } catch (error) {
    console.log(error);
    throw new Error("Error getting hot questions");
  }
}
