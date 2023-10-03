"use server";

import User from "@/database/user.modal";
import { connectToDataBase } from "../mongoose";

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
