import { isValidObjectId, PaginateOptions } from "mongoose";
import { Conversation, ForwardedQuery, User, Notification } from "../models";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { reverseGeocode } from "../utils/location";
import {
  UserRole,
  NotificationType,
  ForwardedQueryStatus,
} from "../types/enums";
import mongoose from "mongoose";
import { forwardQueryService } from "../services/forwardedQuery.service";
import { notificationService } from "../services/notification.service";

// user access controllers
const forwardQuery = asyncHandler(async (req, res) => {
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
  // trigger the event to generate summary and question
  forwardQueryService.forwardQuery({
    forwardedQueryId: createdQuery._id.toString(),
  });

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
    //sending the notifications to the officers
    notifications.forEach((notification) => {
      console.log("Creating notification:", notification);
      notificationService.sendNotification({
        userId: notification.user.toString(),
        title: notification.title,
        message: notification.message,
      });
    });
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

const getMyForwardedQueries = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query;
  const paginateOptions: PaginateOptions = {
    page: Number(page),
    limit: Number(limit),
  };
  const queries = await ForwardedQuery.aggregatePaginate(
    [
      {
        $match: {
          forwardedBy: new mongoose.Types.ObjectId(user._id),
        },
      },
    ],
    paginateOptions,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, queries, "Queries fetched successfully"));
});

// officer access controllers
const getOfficerForwardedQueries = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query;
  const paginateOptions: PaginateOptions = {
    page: Number(page),
    limit: Number(limit),
  };
  const queries = await ForwardedQuery.aggregatePaginate(
    [
      {
        $match: {
          targetOfficers: new mongoose.Types.ObjectId(user._id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "forwardedBy",
          foreignField: "_id",
          as: "forwardedBy",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                phone: 1,
                address: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          forwardedBy: {
            $arrayElemAt: ["$forwardedBy", 0],
          },
        },
      },
    ],
    paginateOptions,
  );

  return res.status(200).json(new ApiResponse(200, queries));
});

const getForwaredQueryById = asyncHandler(async (req, res) => {
  const { forwardedQueryId } = req.params;
  const status = req.query.status;

  if (!isValidObjectId(forwardedQueryId)) {
    throw new ApiError(400, "Invalid forwardedQueryId");
  }

  const queries = await ForwardedQuery.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(forwardedQueryId as string),
        targetOfficers: new mongoose.Types.ObjectId(req.user._id),
        ...(status ? { status: status as string } : {}),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "forwardedBy",
        foreignField: "_id",
        as: "forwardedBy",
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "conversations",
        localField: "conversation",
        foreignField: "_id",
        as: "conversation",
        pipeline: [
          {
            $lookup: {
              from: "messages",
              localField: "_id",
              foreignField: "conversation",
              as: "messages",
              pipeline: [
                {
                  $project: {
                    senderRole: 1,
                    text: 1,
                    files: 1,
                    createdAt: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              title: 1,
              messages: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        forwardedBy: {
          $arrayElemAt: ["$forwardedBy", 0],
        },
      },
    },
  ]);

  if (!queries || queries.length === 0) {
    throw new ApiError(404, "Forwarded query not found");
  }

  const forwardedQuery = queries[0];

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { forwardedQuery },
        "Fowarded query fetched successfully",
      ),
    );
});

const answerForwardedQuery = asyncHandler(async (req, res) => {
  const { forwardedQueryId } = req.params;
  const { answer } = req.body;
  if (!isValidObjectId(forwardedQueryId)) {
    throw new ApiError(400, "Invalid forwardedQueryId");
  }
  const forwardedQuery = await ForwardedQuery.findById(forwardedQueryId);
  if (!forwardedQuery) {
    throw new ApiError(404, "Forwarded query not found");
  }
  const officerId = req.user._id;
  if (!forwardedQuery.targetOfficers.includes(officerId)) {
    throw new ApiError(403, "You are not authorized to answer this query");
  }
  forwardedQuery.answer = answer;
  forwardedQuery.status = ForwardedQueryStatus.ANSWERED;
  forwardedQuery.answeredBy = officerId;
  await forwardedQuery.save({ validateBeforeSave: false });

  //
  forwardQueryService.ingestQuery({
    forwardedQueryId: forwardedQueryId.toString(),
  });
  // Notify the farmer
  await Notification.create({
    user: forwardedQuery.forwardedBy,
    type: NotificationType.QUERY_ANSWERED,
    title: "Your Query has been Answered",
    message: `Your forwarded query has been answered by an officer.`,
    data: {
      queryId: forwardedQuery._id,
      conversationId: forwardedQuery.conversation,
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { forwardedQuery },
        "Query answered and notified the farmer",
      ),
    );
});

export {
  getMyForwardedQueries,
  getOfficerForwardedQueries,
  getForwaredQueryById,
  forwardQuery,
  answerForwardedQuery,
};
