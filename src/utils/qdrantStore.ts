// utils/qdrantStore.ts
import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});
// constants/vectorCollections.ts
export const QDRANT_COLLECTIONS = {
  FORWARDED_QUERY_ANSWERS: "forwarded_query_answers",
  COLLECTION_NAME: "krishi_sahayak",
};
export const COLLECTION_NAME = "krishi_sahayak";
