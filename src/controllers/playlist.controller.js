import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId format");
  }

  const playlists = await Playlist.find({ owner: userId })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 }); // latest first

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully"),
    );
});
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlistId format");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }
  const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId }, // it prevents from duplicate
    },
    {
      returnDocument: "after",
    },
  );
  if (!addVideo) throw new ApiError(404, "Playlist not found");
  return res
    .status(200)
    .json(
      new ApiResponse(200, addVideo, "video added to playlist successfully"),
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }
  const deleteVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    {
      returnDocument: "after",
    },
  );
  if (!deleteVideo) throw new ApiError(404, "Playlist not found");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deleteVideo,
        "video removed from playlist successfully",
      ),
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletePlaylist, "playlist deleted successfully"),
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    {
      returnDocument: "after",
    },
  ).populate("owner", "username fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist updated successfully"),
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
