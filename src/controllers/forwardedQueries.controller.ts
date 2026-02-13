import { Conversation, ForwardedQuery } from "../models";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { generateConversationSummary } from "../helpers/conversationSummary";
import { ApiResponse } from "../utils/apiResponse";

export const forwardQuery = asyncHandler(async (req, res) => {
  const { conversationId, language } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Generate summary from checkpointer history
  const conversationSummary = await generateConversationSummary({
    conversationId,
    language,
  });

  // TODO: Implement the actual forwarding logic (e.g., send email to expert, save to ForwardedQuery collection, etc.)
  // For now, we return the summary in the response.
  ForwardedQuery.create({});

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { conversationSummary },
        "Query forwarded successfully",
      ),
    );
});
