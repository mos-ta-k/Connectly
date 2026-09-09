import User from "../models/user.model.js";
import { uploadFileToCloudinary } from "../services/cloudinary.service.js";

export const updateProfile = async (req, res) => {
  const { username, about } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const file = req.file;

    if (file) {
      const uploadResult = await uploadFileToCloudinary(file, {
        folder: "connectly/profiles",
      });
      user.avatarUrl = uploadResult.secure_url;
    }

    //update username
    if (username) {
      user.username = username;
    }

    // update bio section
    if (about) {
      user.about = about;
    }

    await user.save();

    return res.status(200).json({
      message: "User profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: error.message || "Failed to update user.",
    });
  }
};
