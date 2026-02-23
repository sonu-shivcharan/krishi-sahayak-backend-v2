import { EventEmitter } from "node:stream";
import { QDRANT_COLLECTIONS, qdrantClient } from "../utils/qdrantStore";
import { ForwardedQuery } from "../models";
import {
  generateConversationSummary,
  generateQuestionFromSummary,
} from "../utils/conversationSummary";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { randomUUID } from "node:crypto";

type ForwardedQueryProp = {
  forwardedQueryId: string;
};
class ForwardQueryService extends EventEmitter {
  ingestQuery(payload: ForwardedQueryProp) {
    this.emit("query.answered", payload);
    console.log(
      "query.answered ingesting the query to vectorDB payload:",
      payload,
    );
  }
  forwardQuery(payload: ForwardedQueryProp) {
    this.emit("query.forwarded", payload);
    console.log(
      "query.forwarded ingesting the query to vectorDB payload:",
      payload,
    );
  }
}

export const forwardQueryService = new ForwardQueryService();
forwardQueryService.on(
  "query.answered",
  async (payload: ForwardedQueryProp) => {
    console.log("Query answered → starting vector ingestion");

    try {
      const fq = await ForwardedQuery.findById(payload.forwardedQueryId);

      if (!fq) return;

      const { answer, conversation, answeredBy, question } = fq;

      // 1. Generate conversation summary
      const summary = await generateConversationSummary({
        conversationId: conversation.toString(),
      });

      // 2. Build full semantic context
      const contextText = buildForwardedQueryContext({
        answer: answer as string,
        summary,
      });

      // 3. Chunk the context
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });

      const chunks = await textSplitter.splitText(contextText);

      // 4. Ingest chunks into Qdrant
      const points = chunks.map((chunk, index) => ({
        id: randomUUID(),
        vector: {
          text: chunk,
          model: "sentence-transformers/all-minilm-l6-v2",
        },
        payload: {
          forwardedQueryId: fq._id.toString(),
          conversationId: conversation,
          answeredBy: answeredBy?.toString(),
          question,
          answer,
          summary,
          type: "forwarded_query_answer",
          createdAt: new Date().toISOString(),
          chunkIndex: index,
        },
      }));

      await qdrantClient.upsert(QDRANT_COLLECTIONS.FORWARDED_QUERY_ANSWERS, {
        points,
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

forwardQueryService.on(
  "query.forwarded",
  async (payload: ForwardedQueryProp) => {
    console.log(
      `query.forwarded : ${payload.forwardedQueryId} updating the fields`,
    );
    try {
      const fq = await ForwardedQuery.findById(payload.forwardedQueryId).lean();

      if (!fq) return;

      const { conversation } = fq;

      // 1. Generate conversation summary
      const summary = await generateConversationSummary({
        conversationId: conversation.toString(),
      });

      // create a question uising the summary 1 or 2 lines
      const question = await generateQuestionFromSummary(summary);

      // Update the forwarded query in the DB with the generated summary and question
      await ForwardedQuery.findByIdAndUpdate(payload.forwardedQueryId, {
        summary,
        question,
      });

      console.log(
        `query.forwarded: queryId(${payload.forwardedQueryId}) successfully updated with summary and question`,
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
