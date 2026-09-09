import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    Conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "conversation is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    imageOrVideo: {
      type: String,
    },
    contentType: {
      type: String,
      enum: ["images", "video", "text", "audio"],
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.type.ObjectId,
          emoji: String,
        },
      },
    ],
    messageString: {
      type: String,
      default: "send",
    },
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", MessageSchema);

export default Message;
