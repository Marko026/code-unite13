import mongoose from "mongoose";

let isConnected: boolean = false;

export const connectToDataBase = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) return console.log("MONGODB_URL not found");

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: "devFlow",
    });
    isConnected = true;
  } catch (error) {
    console.log("MongoDB connection failed", error);
  }
};
