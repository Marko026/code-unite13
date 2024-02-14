"use server";

import User from "@/database/user.modal";
import { connectToDataBase } from "../mongoose";
import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTopInteractedTagsParams,
} from "./shared.types";
import Tag, { ITag } from "@/database/tag.model";
import { FilterQuery } from "mongoose";

export async function getTopInteractedTags(params: GetTopInteractedTagsParams) {
  try {
    connectToDataBase();
    const { userId } = params;
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // find interactions for the user and group by tags
    // we have to create a new model called interaction in data base

    return [
      { _id: 1, name: "tag1" },
      { _id: 2, name: "tag2" },
      { _id: 3, name: "tag3" },
    ];
  } catch (error) {
    // console.log(error);
    // throw new Error("Error getting top interacted tags");
  }
}

export async function getAllTags(params: GetAllTagsParams) {
  try {
    connectToDataBase();
    const { searchQuery } = params;

    const query: FilterQuery<typeof Tag> = {};
    if (searchQuery) {
      query.$or = [{ name: { $regex: new RegExp(searchQuery, "i") } }];
    }

    const tags = await Tag.find(query);
    return { tags };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting top interacted tags");
  }
}
export async function getQuestionByIdTagId(params: GetQuestionsByTagIdParams) {
  try {
    connectToDataBase();
    const { tagId, searchQuery } = params;
    const tagFilter: FilterQuery<ITag> = { _id: tagId };

    // This code snippet finds a single document in the "Tag" collection that matches the "tagFilter" criteria. It then populates the "questions" field of the document with additional data from the "Questions" collection, including filtering the questions based on
    const tag = await Tag.findOne(tagFilter).populate({
      path: "questions",
      model: "Questions",
      match: searchQuery
        ? { title: { $regex: new RegExp(searchQuery, "i") } }
        : {},
      options: { sort: { createdAt: -1 } },
      populate: [
        { path: "author", model: User, select: "_id name picture" },
        { path: "tags", model: Tag, select: "_id name" },
      ],
    });
    if (!tag) {
      throw new Error("User not found");
    }
    const questions = tag.questions;

    return { tagTitle: tag.name, questions };
  } catch (error) {
    console.log(error);
    throw new Error("Error getting question by id");
  }
}
export async function getPopularTags() {
  try {
    connectToDataBase();
    const popularTags = await Tag.aggregate([
      { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
      { $sort: { numberOfQuestions: -1 } },
      { $limit: 5 },
    ]);
    return popularTags;
  } catch (error) {
    console.log(error);
    throw new Error("Error getting top interacted tags");
  }
}
