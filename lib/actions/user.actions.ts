"use server";

import User from "@/database/user.modal";
import { connectToDataBase } from "../mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  UpdateUserParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import Questions from "@/database/question.modal";

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
export async function updateUser(params: UpdateUserParams) {
  try {
    await connectToDataBase();
    const { clerkId, updateData, path } = params;
    await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });
    revalidatePath(path);
  } catch (error) {}
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
    const userQuestionsIds = await Questions.find({
      author: user._id,
    }).distinct("_id");
    // delete user questions
    await Questions.deleteMany({ author: user._id });
    const deletedUser = await User.findByIdAndDelete(user._id);
    return deletedUser;
    // TODO delate user answers and comments ...
  } catch (error) {}
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
