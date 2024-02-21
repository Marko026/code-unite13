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
import { BadgeCriteriaType } from "@/types";
import { assignBadges } from "../utils";

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
    connectToDataBase();
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;
    const skipAmount = (page - 1) * pageSize;

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

    const users = await User.find(query)
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    const totalUsers = await User.countDocuments(query);
    const isNext = totalUsers > skipAmount + users.length;
    return { users, isNext };
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
    await connectToDataBase();
    const { clerkId, searchQuery, filter, page = 1, pageSize = 4 } = params;
    const skipAmount = (page - 1) * pageSize;

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
      options: { sort: sortOptions, skip: skipAmount, limit: pageSize + 1 },
      populate: [
        { path: "author", model: User, select: "_id name picture" },
        { path: "tags", model: Tag, select: "_id name" },
      ],
    });
    const isNext = user.saved.length > pageSize;
    if (!user) {
      throw new Error("User not found");
    }
    const savedQuestions = user.saved;

    return { questions: savedQuestions, isNext };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting saved questions");
  }
}

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

    const [questionUpVotes] = await Questions.aggregate([
      { $match: { author: user._id } },
      { $project: { upvotes: { $size: "$upvotes" } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotes" } } },
    ]);

    const [answerUpVotes] = await Answer.aggregate([
      { $match: { author: user._id } },
      { $project: { upvotes: { $size: "$upvotes" } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotes" } } },
    ]);

    const [questionViews] = await Questions.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    const criteria = [
      { type: "QUESTION_COUNT" as BadgeCriteriaType, count: totalQuestions },
      { type: "ANSWER_COUNT" as BadgeCriteriaType, count: totalAnswers },
      {
        type: "QUESTION_UPVOTES" as BadgeCriteriaType,
        count: questionUpVotes?.totalUpvotes || 0,
      },
      {
        type: "ANSWER_UPVOTES" as BadgeCriteriaType,
        count: answerUpVotes?.totalUpvotes || 0,
      },
      {
        type: "TOTAL_VIEWS" as BadgeCriteriaType,
        count: questionViews?.totalViews || 0,
      },
    ];

    const badgeCounts = assignBadges({ criteria });

    return { user, totalQuestions, totalAnswers, badgeCounts };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user info");
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  if (!params.userId) throw new Error("User not found");
  const { userId, page = 1, pageSize = 4 } = params;
  const skipAmount = (page - 1) * pageSize;
  try {
    connectToDataBase();
    const totalQuestions = await Questions.countDocuments({ author: userId });
    const userQuestions = await Questions.find({ author: userId })
      .sort({ createdAt: -1, views: -1, upvotes: -1 })
      .skip(skipAmount)
      .limit(pageSize)
      .populate("tags", "_id name")
      .populate("author", " _id clerkId name picture");
    const isNext = totalQuestions > skipAmount + userQuestions.length;
    return { totalQuestions, questions: userQuestions, isNext };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting user questions");
  }
}

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    connectToDataBase();

    const { userId, page = 1, pageSize = 2 } = params;
    const skipAmount = (page - 1) * pageSize;
    if (!userId) throw new Error("User not found");
    const totalAnswers = await Answer.countDocuments({ author: userId });

    const userAnswers = await Answer.find({ author: userId })
      .sort({ upvotes: -1 })
      .skip(skipAmount)
      .limit(pageSize)
      .populate("question", "_id title")
      .populate("author", "_id clerkId name picture");

    const isNext = totalAnswers > skipAmount + userAnswers.length;

    return { totalAnswers, answers: userAnswers, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
