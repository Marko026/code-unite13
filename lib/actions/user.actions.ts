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
  await connectToDataBase();
  return await User.create(userData);
}

export async function updateUser(params: UpdateUserParams) {
  await connectToDataBase();
  const { clerkId, updateData, path } = params;
  await User.findOneAndUpdate({ clerkId }, updateData, { new: true });
  revalidatePath(path);
}

export async function userDeleted(params: DeleteUserParams) {
  await connectToDataBase();
  const { clerkId } = params;
  const user = await User.findOneAndDelete({ clerkId });
  if (!user) throw new Error("User not found");
  await Questions.deleteMany({ author: user._id });
  return await User.findByIdAndDelete(user._id);
}

export async function getUserById(params: any) {
  await connectToDataBase();
  const { userId } = params;
  return await User.findOne({ clerkId: userId });
}
