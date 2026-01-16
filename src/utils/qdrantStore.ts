import { QdrantClient } from "@qdrant/js-client-rest";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { QdrantVectorStore } from "@langchain/qdrant";

const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2",
});

export async function getQdrantStore() {
  const store = await QdrantVectorStore.fromExistingCollection(embeddings, {
    client,
    collectionName: "krishi_sahayak",
    contentPayloadKey: "page_content",
    metadataPayloadKey: "metadata",
  });

  return store;
}
