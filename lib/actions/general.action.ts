"use server";

import { SearchParams } from "./shared.types";
import { connectToDataBase } from "../mongoose";
import User from "@/database/user.modal";
import Answer from "@/database/answer.modal";
import Tag from "@/database/tag.model";
import Questions from "@/database/question.model";

const SearchableTypes = ["question", "user", "answer", "tag"];
export async function globalSearch(params: SearchParams) {
  try {
    await connectToDataBase();
    const { query, type } = params;
    const regexQuery = { $regex: query, $options: "i" };

    let results = [];
    const modelsAndTypes = [
      {
        model: Questions,
        searchFields: "title",
        type: "question",
      },
      {
        model: User,
        searchFields: "name",
        type: "user",
      },
      {
        model: Answer,
        searchFields: "content",
        type: "answer",
      },
      {
        model: Tag,
        searchFields: "name",
        type: "tag",
      },
    ];
    const typeLower = type?.toLowerCase();
    if (!typeLower || !SearchableTypes.includes(typeLower)) {
      for (const { model, searchFields, type } of modelsAndTypes) {
        const queryResults = await model
          .find({ [searchFields]: regexQuery })
          .limit(2);
        results.push(
          ...queryResults.map((item: any) => ({
            title:
              type === "answer"
                ? `Answer containing ${query}`
                : item[searchFields],
            type,
            id:
              type === "user"
                ? item.clerkId
                : type === "answer"
                  ? item.question
                  : item._id,
          })),
        );
      }
    } else {
      // search specific type
      const modelInfo = modelsAndTypes.find((item) => item.type === type);
      if (!modelInfo) {
        throw new Error("Invalid type");
      }
      const queryResults = await modelInfo.model
        .find({ [modelInfo.searchFields]: regexQuery })
        .limit(8);

      results = queryResults.map((item: any) => ({
        title:
          type === "answer"
            ? `Answer containing ${query}`
            : item[modelInfo.searchFields],
        type,
        id:
          type === "user"
            ? item.clerkId
            : type === "answer"
              ? item.question
              : item._id,
      }));
    }
    return JSON.stringify(results);
  } catch (error) {
    console.log(`Error fetching global search ${error}`);
    throw error;
  }
}
