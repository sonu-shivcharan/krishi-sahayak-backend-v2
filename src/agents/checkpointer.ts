import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

const client = new MongoClient(process.env.MONGODB_URL!);

export const checkpointer = new MongoDBSaver({
  client,
  checkpointCollectionName: "checkpointer",
  dbName: "krishi-sahayak",
});
