import { Schema, model, models, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  questions: Schema.Types.ObjectId[];
  followers: Schema.Types.ObjectId[];
  description: string;
  createdOn: Date;
}

const tagSchema = new Schema({
  questions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Questions",
    },
  ],
  name: {
    type: String,
    required: true,
    unique: true,
  },
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
  ],

  description: String,
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const Tag = models.Tag || model("Tag", tagSchema);

export default Tag;
