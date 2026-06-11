import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
// import {Subscription} from "../models/subscription.model.js"
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const videosResult = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);
  const totalVideos = videosResult[0]?.totalVideos || 0;
  const totalViews = videosResult[0]?.totalViews || 0;

  const totalSubscribers = await Subscription.countDocuments({
    channel: req.user._id,
  });
  const result = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "video",
        as: "videoInfo",
      },
    },
    { $unwind: "$videoInfo" },
    {
      $match: {
        "videoInfo.owner": new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $count: "totalLikes",
    },
  ]);
  const totalLikes = result[0]?.totalLikes || 0;

  const stats = {
    totalVideos,
    totalViews,
    totalSubscribers,
    totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "User data fetched Successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .select("title description videoFile thumbnail views createdAt");

  return res.status(200).json(new ApiResponse(200, videos, "All Videos for this channel fetched"));
});

export { getChannelStats, getChannelVideos };
