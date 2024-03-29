import { Schema, model, models, Document } from "mongoose";

type Author = {
  _id: number;
  name: string;
  picture: string;
  clerkId: string;
};

export interface IQuestions extends Document {
  title: string;
  content: String;
  tags: { _id: number; name: string }[];
  upvotes: Schema.Types.ObjectId[];
  downvotes: Schema.Types.ObjectId[];
  answers: Schema.Types.ObjectId[];
  views: number;
  author: Author;
  createdAt: Date;
}

const questionSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [Schema.Types.ObjectId],
    ref: "Tag",
  },
  upvotes: {
    type: [Schema.Types.ObjectId],
    ref: "Users",
  },
  downvotes: {
    type: [Schema.Types.ObjectId],
    ref: "Users",
  },
  answers: {
    type: [Schema.Types.ObjectId],
    ref: "Answers",
  },
  views: {
    type: Number,
    default: 0,
  },
  author: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Questions = models.Questions || model("Questions", questionSchema);

export default Questions;
