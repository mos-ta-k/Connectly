import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: [true, "Email is already registered."],
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      unique: [true, "Username is already taken."],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    verified: {
      type: Boolean,
      default: false
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    about: {
      type: String,
      trim: true,
      maxlength: 139,
      default: "Hey there! I am using Connectly.",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
