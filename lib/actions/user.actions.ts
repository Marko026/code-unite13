"use server";

import User from "@/database/user.modal";
import { connectToDataBase } from "../mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserByIdParams,
  GetUserStatsParams,
  ToggleSaveQuestionParams,
  UpdateUserParams,
} from "./shared.types";
import { FilterQuery } from "mongoose";
import { revalidatePath } from "next/cache";
import Questions from "@/database/question.model";
import Tag from "@/database/tag.model";
import Answer from "@/database/answer.modal";

export async function createUser(userData: CreateUserParams) {
  try {
    await connectToDataBase();
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error("Error creating user");
  }
}
export async function getAllUsers(params: GetAllUsersParams) {
  try {
    await connectToDataBase();

    const { searchQuery, filter } = params;
    const query: FilterQuery<typeof User> = {};
    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(searchQuery, "i") } },
        { username: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }
    let sortOptions = {};
    switch (filter) {
      case "new_users":
        sortOptions = { joinAt: -1 };
        break;
      case "old_users":
        sortOptions = { joinAt: 1 };
        break;
      case "top_contributors":
        sortOptions = { reputation: -1 };
        break;
      default:
        break;
    }

    const users = await User.find(query).sort(sortOptions);
    return { users };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user");
  }
}
export async function updateUser(params: UpdateUserParams) {
  try {
    await connectToDataBase();
    const { clerkId, updateData, path } = params;
    await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error updating user");
  }
}
export async function userDeleted(params: DeleteUserParams) {
  try {
    await connectToDataBase();
    const { clerkId } = params;
    const user = await User.findOneAndDelete({ clerkId });
    if (!user) {
      throw new Error("User not found");
    }
    // Delete user from database
    // and questions,answers,comments,upvotes,downvotes ....

    // get user question id
    // const userQuestionsIds = await Questions.find({
    //   author: user._id,
    // }).distinct("_id");
    // delete user questions
    await Questions.deleteMany({ author: user._id });
    const deletedUser = await User.findByIdAndDelete(user._id);
    return deletedUser;
    // TODO delate user answers and comments ...
  } catch (error) {
    console.log(error);

    throw new Error("Error deleting user");
  }
}

export async function getUserById(params: any) {
  try {
    await connectToDataBase();

    const { userId } = params;

    const user = await User.findOne({ clerkId: userId });
    return user;
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user");
  }
}

export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
  try {
    connectToDataBase();
    const { questionId, userId, path } = params;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const isQuestionSaved = user.saved.includes(questionId);
    if (isQuestionSaved) {
      // remove question from saved list
      await User.findByIdAndUpdate(
        userId,
        { $pull: { saved: questionId } },
        { new: true },
      );
    } else {
      // add question to saved list
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { saved: questionId } },
        { new: true },
      );
    }
    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw new Error("Error saving question");
  }
}
export async function getSavedQuestion(params: GetSavedQuestionsParams) {
  try {
    connectToDataBase();
    const { clerkId, searchQuery, filter } = params;
    const query: FilterQuery<typeof Questions> = searchQuery
      ? { title: { $regex: new RegExp(searchQuery, "i") } }
      : {};

    let sortOptions = {};

    switch (filter) {
      case "most_recent":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "most_voted":
        sortOptions = { upvotes: -1 };
        break;
      case "most_viewed":
        sortOptions = { views: -1 };
        break;
      case "most_answered":
        sortOptions = { answers: -1 };
        break;
      default:
        break;
    }

    const user = await User.findOne({ clerkId }).populate({
      path: "saved",
      match: query,
      options: { sort: sortOptions },
      populate: [
        { path: "author", model: User, select: "_id name picture" },
        { path: "tags", model: Tag, select: "_id name" },
      ],
    });
    if (!user) {
      throw new Error("User not found");
    }
    const savedQuestions = user.saved;

    return { questions: savedQuestions };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting saved questions");
  }
}
// @ get userInfo

export async function getUserInfo(params: GetUserByIdParams) {
  try {
    connectToDataBase();
    const { userId } = params;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    const totalQuestions = await Questions.countDocuments({ author: user._id });
    const totalAnswers = await Answer.countDocuments({ author: user._id });

    return { user, totalQuestions, totalAnswers };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user info");
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  if (!params.userId) throw new Error("User not found");
  const { userId } = params;
  try {
    connectToDataBase();
    const totalQuestions = await Questions.countDocuments({ author: userId });

    const userQuestions = await Questions.find({ author: userId })
      .sort({ views: -1, upVotes: -1 })
      .populate("tags", "_id name")
      .populate("author", " _id clerkId name picture");
    return { totalQuestions, questions: userQuestions };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user questions");
  }
}

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    connectToDataBase();

    const { userId } = params;

    if (!userId) throw new Error("User not found");
    const totalAnswers = await Answer.countDocuments({ author: userId });

    const userAnswers = await Answer.find({ author: userId })
      .sort({ upvotes: -1 })
      .populate("question", "_id title")
      .populate("author", "_id clerkId name picture");

    return { totalAnswers, answers: userAnswers };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
