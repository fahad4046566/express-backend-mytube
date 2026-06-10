import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skipDocuments = (pageNumber - 1) * limitNumber;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid ObjectId");
  }
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const result = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: {
          _id: "$userDetails._id",
          username: "$userDetails.username",
          fullName: "$userDetails.fullName",
          avatar: "$userDetails.avatar",
        },
      },
    },
    {
      $facet: {
        paginatedComments: [{ $skip: skipDocuments }, { $limit: limitNumber }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const paginatedComments = result[0]?.paginatedComments || [];
  const totalCount = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limitNumber);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: paginatedComments,
        totalComments: totalCount,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
      "All Comments Fetched Successfully",
    ),
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment is empty");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "video not found");

  const add = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, add, "Comment Added"));
});
const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment is empty");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access");
  }
  const update = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    { returnDocument: "after" },
  ).populate("owner", "username avatar");

  return res.status(200).json(new ApiResponse(200, update, "Comment Updated"));
});
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access");
  }
  const deleted = await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(new ApiResponse(200, deleted, "Comment Deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
