import { Schema, model, models, Document } from "mongoose";

export interface IQuestions extends Document {
  title: string;
  content: String;
  tags: Schema.Types.ObjectId[];
  upvotes: Schema.Types.ObjectId[];
  downvotes: Schema.Types.ObjectId[];
  answers: Schema.Types.ObjectId[];
  views: number;
  author: Schema.Types.ObjectId;
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
  author: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Questions = models.Questions || model("Questions", questionSchema);

export default Questions;
