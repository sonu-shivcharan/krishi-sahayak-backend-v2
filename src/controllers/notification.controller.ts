import { Notification } from "../models";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";

const getMyNotifications = asyncHandler(async (req, res) => {
  const user = req.user;
  const notifications = await Notification.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const user = req.user;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const user = req.user;

  await Notification.updateMany(
    { user: user._id, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications marked as read"));
});

export {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
