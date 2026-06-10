import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "video not found");

  const likeCheck = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  let result;
  let message;
  if (likeCheck) {
    await Like.findByIdAndDelete(likeCheck._id);
    result = null;
    message = "Unliked";
  } else {
    const newLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    result = newLike;
    message = "Liked";
  }

  return res.status(200).json(new ApiResponse(200, result, message));
});
const toggleCommentsLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) throw new ApiError(404, "comment not found");

  const likeCheck = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  let result;
  let message;

  if (likeCheck) {
    await Like.findByIdAndDelete(likeCheck._id);
    result = null;
    message = "Unliked";
  } else {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    result = newLike;
    message = "Liked";
  }
  return res.status(200).json(new ApiResponse(200, result, message));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skipDocuments = (pageNumber - 1) * limitNumber;

  const result =await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "video",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $project: {
        _id: "$videoDetails._id",
        title: "$videoDetails.title",
        thumbnail: "$videoDetails.thumbnail",
        videoFile: "$videoDetails.videoFile",
        duration: "$videoDetails.duration",
        views: "$videoDetails.views",
        owner: "$videoDetails.owner",
        likedAt: "$createdAt",
      },
    },
    {
      $facet: {
        paginatedVideos: [{ $skip: skipDocuments }, { $limit: limitNumber }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);
  const paginatedVideos = result[0]?.paginatedVideos || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limitNumber);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: paginatedVideos,
        totalLikes: totalCount,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
      "All Videos Fetched Successfully",
    ),
  );
});
export { getLikedVideos, toggleVideoLike, toggleCommentsLike };
