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

export const initQdrant = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS,
    );

    if (!exists) {
      console.log(
        `Creating collection: ${QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS}`,
      );
      await qdrantClient.createCollection(
        QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS,
        {
          vectors: {
            size: 384, // size for sentence-transformers/all-minilm-l6-v2
            distance: "Cosine",
          },
        },
      );
    }

    console.log("Ensuring Qdrant payload indices...");
    await qdrantClient.createPayloadIndex(
      QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS,
      {
        field_name: "forwardedQueryId",
        field_schema: "keyword",
        wait: true,
      },
    );
    console.log("Qdrant initialization complete.");
  } catch (error) {
    console.log("Qdrant init note: Index might already exist or collection is being initialized.");
    // We don't throw here to prevent server crash if index exists, but log it
  }
};

