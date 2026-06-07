import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/cloudinary.js";
import getPublicIdFromDynamicUrl from "../utils/PublicIdFromUrl.js";

import mongoose from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const sortDirection = sortType === "desc" ? -1 : 1; // for 2nd pipeline for sort data
  const sortField = sortBy || "createdAt";

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skipDocuments = (pageNumber - 1) * limitNumber; // for 3rd pipeline for paginaton

  const matchStage = { isPublished: true };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const result = await Video.aggregate([
    { $match: matchStage },
    {
      $facet: {
        paginatedVideos: [
          { $sort: { [sortField]: sortDirection } },
          { $skip: skipDocuments },
          { $limit: limitNumber },
        ],
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
        totalVideos: totalCount,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
      "All Videos Fetched Successfully",
    ),
  );
});

const getuploadConfig = asyncHandler(async (req, res) => {
  const config = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
  };
  return res
    .status(200)
    .json(new ApiResponse(201, config, "config fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, thumbnail, videoFile, duration } = req.body;
  if (
    [title, description, thumbnail, videoFile].some((field) => !field?.trim())
  ) {
    throw new ApiError(400, "All fields are required");
  }

  let videoUrl, thumbnailUrl;
  if (
    videoFile.includes("res.cloudinary.com") &&
    thumbnail.includes("res.cloudinary.com")
  ) {
    videoUrl = videoFile;
    thumbnailUrl = thumbnail;
  } else {
    throw new ApiError(400, "This is not Cloudinary Url");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoUrl,
    thumbnail: thumbnailUrl,
    duration: duration || 0,
    owner: req.user._id,
    isPublished: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video created successfully"));
});

const getVideoByID = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { returnDocument: "after" },
  ).populate("owner", "username fullName avatar");
  if (!video) {
    throw new ApiError(404, "Video not found with the provided id");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail, isPublished } = req.body;
  if (Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Fields are required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access");
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (thumbnail) updateData.thumbnail = thumbnail;
  if (isPublished !== undefined) updateData.isPublished = isPublished;

  const updateVideo = await Video.findByIdAndUpdate(videoId, updateData, {
    returnDocument: "after",
  }).populate("owner", "username fullName avatar");
  if (!video) {
    throw new ApiError(404, "Video not found with the provided id");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access");
  }
  const deleteVideo = await Video.findByIdAndDelete(videoId);

  const videoPublicId = getPublicIdFromDynamicUrl(video.videoFile);
  const thumbnailPublicId = getPublicIdFromDynamicUrl(video.thumbnail);
  try {
    if (videoPublicId) await deleteVideoFromCloudinary(videoPublicId, "video");
    if (thumbnailPublicId)
      await deleteImageFromCloudinary(thumbnailPublicId, "image");
  } catch (err) {
    console.error("Failed to delete from Cloudinary:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteVideo, "video delete successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId, bool } = req.params;

  if (bool !== "true" && bool !== "false") {
    throw new ApiError(400, "Invalid status value. Use 'true' or 'false'");
  }
  const isPublished = bool === "true";
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { isPublished },
    { returnDocument: "after" },
  ).populate("owner", "username fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `Video is now ${isPublished ? "Published" : "Unpublished"}`,
      ),
    );
});
export {
  getAllVideos,
  publishVideo,
  getVideoByID,
  updateVideo,
  togglePublishStatus,
  deleteVideo,
  getuploadConfig,
};
