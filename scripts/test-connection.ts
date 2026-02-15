import mongoose from "mongoose";
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/krishi-sahayak";
console.log("Attempting to connect to:", uri);

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("Connected successfully!");
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection failed:", err);
    process.exit(1);
  });
