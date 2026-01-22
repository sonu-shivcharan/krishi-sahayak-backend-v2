import mongoose, { Collection } from "mongoose";

export default async function connectDB() {
  const MONGODB_URL = process.env.MONGODB_URL;
  const DB_NAME = process.env.DB_NAME;
  try {
    if (!MONGODB_URL) {
      throw new Error("Add MONGODB_URL variable to .env");
    }
    if(!DB_NAME){
      throw new Error("Add DB_NAME variable to .env");
    }
    const connection = await mongoose.connect(`${MONGODB_URL}/${DB_NAME}`);
    console.log("MongoDB connection success", connection.connections[0].host);
  } catch (error) {
    // console.error("Mongo db connection error: ", error);
    throw error;
  }
}