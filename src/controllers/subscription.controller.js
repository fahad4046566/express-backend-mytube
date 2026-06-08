import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channel = await User.findById(channelId);
  if (!channel) throw new ApiError(404, "Channel not found");

  const subscriptionCheck = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  let result;
  let message;
  if (subscriptionCheck) {
    await Subscription.findByIdAndDelete(subscriptionCheck._id);
    result = null;
    message = "Channel unsubscribed successfully";
  } else {
    const newSubscription = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    result = newSubscription;
    message = "Channel subscribed successfully";
  }

  return res.status(200).json(new ApiResponse(200, result, message));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid ObjectId");
  }

  const channel = await User.findById(channelId);
  if (!channel) throw new ApiError(404, "Channel not found");

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "subscriber",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: "$subscriberDetails._id",
        username: "$subscriberDetails.username",
        fullName: "$subscriberDetails.fullName",
        avatar: "$subscriberDetails.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully"),
    );
});


const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid ObjectId");
  }
  const subscriber = await User.findById(subscriberId);
  if (!subscriber) throw new ApiError(404, "Subscriber not found");

  const channels = await Subscription.aggregate([
    {
      $match: {
       subscriber: new mongoose.Types.ObjectId(subscriberId)
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "channel",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $project: {
        _id: "$channelDetails._id",
        username: "$channelDetails.username",
        fullName: "$channelDetails.fullName",
        avatar: "$channelDetails.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, channels, "Channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
