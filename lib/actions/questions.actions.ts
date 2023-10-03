/* eslint-disable no-empty */
"use server";
import Questions from "@/database/question.modal";
import Tag from "@/database/tag.model";
import { connectToDataBase } from "../mongoose";
import { CreateQuestionParams, GetQuestionsParams } from "./shared.types";
import User from "@/database/user.modal";
import { revalidatePath } from "next/cache";

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
        { $setOnInsert: { name: tag }, $push: { question: question._id } },
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
