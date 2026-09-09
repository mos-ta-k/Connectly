import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email:{
        type: String,
        required: [true,"email is required"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true,"user is required"]
    },
    otpHash: {
        type: String,
        required: [true,"otp is required"]
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    }
  },
  { timestamps: true }
);

const otpModel = mongoose.model("otp", otpSchema);
export default otpModel;