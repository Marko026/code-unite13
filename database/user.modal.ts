import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
  picture: string;
  location?: string;
  portfolioWebsite?: string;
  reputation: number;
  joinAt: Date;
  saved: Schema.Types.ObjectId[];
}

const userSchema = new Schema({
  clerkId: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  bio: { type: String },
  picture: { type: String },
  location: { type: String },
  portfolioWebsite: { type: String },
  reputation: { type: Number, default: 0 },
  joinAt: { type: Date, default: Date.now },
  saved: [{ type: Schema.Types.ObjectId, ref: "Questions" }],
});

const User = models.User || model("User", userSchema);

export default User;
