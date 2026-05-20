import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
// pre hook in mongoose is used to perform some operations before saving the document to the database. In this case, we are using the pre hook to hash the password before saving the user document to the database.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // isModified is a mongoose method that checks if the password field is modified or not. If the password field is not modified, then we don't need to hash the password again.
  this.password = await bcrypt.hash(this.password, 10);
  // 10 is a round of hashing, the higher the round, the more secure the password is, but it also takes more time to hash the password.
  next();
  // next is a callback function that is called after the pre hook is executed. It is used to move to the next middleware function in the stack.
});
// method in mongoose is used to define a method that can be called on the user document. In this case, we are defining a method called isPasswordCorrect that takes the password as an argument and compares it with the hashed password stored in the database.
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullname,
    },

    process.env.ACCESS_SECRET_TOKEN,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};
userSchema.methods.generateRefresToken = function () {
     return jwt.sign(
    {
      _id: this._id,
    },

    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};
export const User = mongoose.model("User", userSchema);
