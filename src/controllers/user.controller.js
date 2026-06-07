import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteImageFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { json } from "express";
import mongoose from "mongoose";
import getPublicIdFromDynamicUrl from "../utils/PublicIdFromUrl.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};



const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  if (
    [username, email, fullName, password].some((field) => !field?.trim())
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.buffer; // multer se file buffer milta hai, jise hum directly cloudinary me upload kar sakte hain without saving it to disk, isliye humne multer ko memory storage ke sath configure kiya hai
  // path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const coverImageLocalPath = req.files?.coverImage?.[0]?.buffer; // multer se file buffer milta hai, jise hum directly cloudinary me upload kar sakte hain without saving it to disk, isliye humne multer ko memory storage ke sath configure kiya hai
  // path;

  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar image");
  }
  let coverImageUrl = "";
  if (coverImageLocalPath) {
    const uploaded = await uploadOnCloudinary(coverImageLocalPath);
    coverImageUrl = uploaded || "";
  }
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email are required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(
      404,
      "User not found with the provided email or username",
    );
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const refreshAcesstoken = asyncHandler(async (req, res) => {
  const incomingRefreshAcesstoken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshAcesstoken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshAcesstoken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (incomingRefreshAcesstoken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );
    const options = {
      httpOnly: true,
      // secure: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refrehed Successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
    message: "Current user fetched successfully",
  });
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }, // this is used for show updated document
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated Successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarBuffer = req.file?.buffer;

  if (!avatarBuffer) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatarUrl = await uploadOnCloudinary(avatarBuffer);
  if (!avatarUrl) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUrl,
      },
    },
    { returnDocument: "after" },
  ).select("-password -refreshToken");
  const oldAvatar = req.user.avatar;
  
  try {
    if (oldAvatar) {
      const publicId = getPublicIdFromDynamicUrl(oldAvatar);
      if (publicId)  await deleteImageFromCloudinary(publicId,"image");
    }
  } catch (err) {
    console.error("Failed to delete from Cloudinary:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar changed Successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageBuffer = req.file?.buffer;
  if (!coverImageBuffer) {
    throw new ApiError(400, "cover Image  is missing");
  }
  const coverImageUrl = await uploadOnCloudinary(coverImageBuffer);
  if (!coverImageUrl) {
    throw new ApiError(400, "Error while uploading on cover Image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImageUrl,
      },
    },
    { returnDocument: "after" },
  ).select("-password -refreshToken");

    const oldCoverImage = req.user.coverImage;
  
  try {
    if (oldCoverImage) {
      const publicId = getPublicIdFromDynamicUrl(oldCoverImage);
      if (publicId)  await deleteImageFromCloudinary(publicId,"image");
    }
  } catch (err) {
    console.error("Failed to delete from Cloudinary:", err);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image changed Successfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },

        channelToSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelToSubscribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully"),
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully",
      ),
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcesstoken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
