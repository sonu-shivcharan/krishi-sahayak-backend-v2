import { EventEmitter } from "node:stream";
import { QDRANT_COLLECTIONS, qdrantClient } from "../utils/qdrantStore";
import { ForwardedQuery } from "../models";
import { generateConversationSummary } from "../utils/conversationSummary";
import logger from "../utils/logger";

type IngestForwardedQueryProp = {
  forwardedQueryId: string;
};
class ForwardQueryService extends EventEmitter {
  ingestQuery(payload: IngestForwardedQueryProp) {
    this.emit("query.answered", payload);
    logger.log(
      "query.answered ingesting the query to vectorDB payload:",
      payload,
    );
  }
}

export const forwardQueryService = new ForwardQueryService();
forwardQueryService.on(
  "query.answered",
  async (payload: IngestForwardedQueryProp) => {
    console.log("Query answered → starting vector ingestion");

    try {
      const fq = await ForwardedQuery.findById(payload.forwardedQueryId);

      if (!fq) return;

      const { answer, conversation, answeredBy } = fq;

      // 1. Generate conversation summary
      const summary = await generateConversationSummary({
        conversationId: conversation.toString(),
      });

      // 2. Build full semantic context
      const contextText = buildForwardedQueryContext({
        answer: answer as string,
        summary,
      });

      const collection = await qdrantClient.getCollection(
        QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS,
      );
      // if(!collection?.status){
      //   await qdrantClient.createCollection(
      //     QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS,
      //     {
      //       vectors:
      //     }
      //   );
      // }
      await qdrantClient.upsert(QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS, {
        points: [
          {
            id: fq._id.toString(),
            vector: {
              text: contextText,
              model: "sentence-transformers/all-minilm-l6-v2",
            },

            payload: {
              forwardedQueryId: fq._id.toString(),
              conversationId: conversation,
              answeredBy: answeredBy?.toString(),
              // question,
              answer,
              summary,
              type: "forwarded_query_answer",
              createdAt: new Date().toISOString(),
            },
          },
        ],
        wait: true,
      });

      console.log(
        `ForwardedQuery ${fq._id} successfully ingested using Qdrant Cloud Inference`,
      );
    } catch (error) {
      console.error(
        "Error ingesting forwarded query answer into vector DB",
        error,
      );
    }
  },
);

function buildForwardedQueryContext({
  answer,
  summary,
  question,
}: {
  answer: string;
  summary: string;
  question?: string;
}) {
  return `
Conversation Summary:
${summary}

// Farmer Question:
// ${question}

Officer Answer:
${answer}
  `.trim();
}
