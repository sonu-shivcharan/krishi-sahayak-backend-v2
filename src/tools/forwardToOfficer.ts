import { tool } from "langchain";
import z from "zod";
import { Conversation, ForwardedQuery, User, Notification } from "../models";
import { ApiError } from "../utils/apiError";
import { reverseGeocode } from "../utils/location";
import { UserRole, NotificationType } from "../types/enums";
import { forwardQueryService } from "../services/forwardedQuery.service";
import { isValidObjectId } from "mongoose";

export const forwardToOfficer = tool(
  async ({ reason }, { context }) => {
    const { userId, conversationId } = context;

    if (!userId) {
      return "Error: User ID is missing in context.";
    }

    if (!conversationId || !isValidObjectId(conversationId)) {
      return `Error: Invalid or missing conversationId: ${conversationId}`;
    }

    try {
      // 1. Fetch User and Conversation
      const user = await User.findById(userId);
      if (!user) {
        return "Error: User not found.";
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return "Error: Conversation not found.";
      }

      // 2. Resolve Location
      let locationData: {
        lat: number;
        lng: number;
        district?: string;
        taluka?: string;
      } | null = null;

      if (user.location && user.location.coordinates) {
        locationData = {
          lng: user.location.coordinates[0],
          lat: user.location.coordinates[1],
        };
      }

      if (locationData) {
        const { district, taluka } = await reverseGeocode(
          locationData.lat,
          locationData.lng
        );
        locationData.district = district;
        locationData.taluka = taluka;
      }

      // 3. Find Targeted Officers
      let targetOfficerIds: any[] = [];
      if (locationData) {
        const officers = await User.find({
          role: UserRole.OFFICER,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [locationData.lng, locationData.lat],
              },
              $maxDistance: 50000, // 50km radius
            },
          },
          _id: { $ne: user._id },
        }).select("_id");

        targetOfficerIds = officers.map((officer) => officer._id);
      }

      // 4. Create ForwardedQuery
      const queryPayload: any = {
        conversation: conversationId,
        forwardedBy: user._id,
        targetOfficers: targetOfficerIds,
        reason: reason, // Adding reason for forwarding
      };

      if (locationData) {
        queryPayload.location = {
          type: "Point",
          coordinates: [locationData.lng, locationData.lat],
          district: locationData.district,
          taluka: locationData.taluka,
        };
      }

      const createdQuery = await ForwardedQuery.create(queryPayload);

      // Trigger the event to generate summary and question
      forwardQueryService.forwardQuery({
        forwardedQueryId: createdQuery._id.toString(),
      });

      // 5. Send Notifications
      if (targetOfficerIds.length > 0) {
        const notifications = targetOfficerIds.map((officerId) => ({
          user: officerId,
          type: NotificationType.NEW_QUERY,
          title: "New Farmer Query",
          message: `A new query has been forwarded from ${locationData?.taluka || "your area"}. Reason: ${reason}`,
          data: {
            queryId: createdQuery._id,
            conversationId: conversationId,
          },
        }));

        await Notification.insertMany(notifications);
      }

      return `Successfully forwarded the conversation to ${targetOfficerIds.length} officers. The experts will review your query and get back to you soon.`;
    } catch (error: any) {
      console.error("Error in forwardToOfficer tool:", error);
      return `Failed to forward query: ${error.message}`;
    }
  },
  {
    name: "forwardToOfficer",
    description: "Forwards the current conversation context to human Agriculture Officers for further assistance when the digital assistant cannot provide a complete answer. Only use this if you cannot find the answer in the knowledge base or if the user explicitly asks to talk to an officer.",
    schema: z.object({
      reason: z.string().describe("The reason why this query is being forwarded to a human officer."),
    }),
  }
);
