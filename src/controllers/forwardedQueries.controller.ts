import { isValidObjectId } from "mongoose";
import { Conversation, ForwardedQuery, User, Notification } from "../models";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { reverseGeocode } from "../helpers/location";
import { UserRole, NotificationType } from "../types/enums";

export const forwardQuery = asyncHandler(async (req, res) => {
  const { conversationId } = req.body;
  const user = req.user;
  if (!isValidObjectId(conversationId)) {
    throw new ApiError(400, "Invalid conversationId");
  }
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // 1. Resolve Location
  let locationData: {
    lat: number;
    lng: number;
    district?: string;
    taluka?: string;
  } | null = null;

  if (req.body.location && req.body.location.lat && req.body.location.lng) {
    locationData = {
      lat: req.body.location.lat,
      lng: req.body.location.lng,
    };
  } else if (user.location && user.location.coordinates) {
    locationData = {
      lng: user.location.coordinates[0],
      lat: user.location.coordinates[1],
    };
  }

  if (locationData) {
    const { district, taluka } = await reverseGeocode(
      locationData.lat,
      locationData.lng,
    );
    locationData.district = district;
    locationData.taluka = taluka;
  }

  // 2. Find Targeted Officers
  let targetofficerIds: any[] = [];
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
      _id: { $ne: user._id }, // Exclude self if user is an officer
    }).select("_id");

    targetofficerIds = officers.map((officer) => officer._id);
  }

  // 3. Create ForwardedQuery
  const queryPayload: any = {
    conversation: conversationId,
    forwardedBy: user._id,
    targetOfficers: targetofficerIds,
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

  // 4. Send Notifications
  if (targetofficerIds.length > 0) {
    const notifications = targetofficerIds.map((officerId) => ({
      user: officerId,
      type: NotificationType.NEW_QUERY,
      title: "New Farmer Query",
      message: `A new query has been forwarded from ${locationData?.taluka || "your area"}.`,
      data: {
        queryId: createdQuery._id,
        conversationId: conversationId,
      },
    }));

    await Notification.insertMany(notifications);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        forwardedQueryId: createdQuery._id,
        officersNotified: targetofficerIds.length,
        location: {
          district: locationData?.district,
          taluka: locationData?.taluka,
        },
      },
      "Query forwarded successfully",
    ),
  );
});

// export const getForwardedQueries = asyncHandler(async (req, res) => {
//   const user = req.user;
//   const { page = 1, limit = 10 } = req.query;
