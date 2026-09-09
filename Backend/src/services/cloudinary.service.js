import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const temporaryUploadDirectory = path.join(os.tmpdir(), "connectly-uploads");
fs.mkdirSync(temporaryUploadDirectory, { recursive: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.diskStorage({
    destination: temporaryUploadDirectory,
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname || "");
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: Number.parseInt(
      process.env.CLOUDINARY_MAX_FILE_SIZE || "52428800",
      10,
    ),
    files: 1,
  },
});

class CloudinaryUploadError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "CloudinaryUploadError";
    this.code = "CLOUDINARY_UPLOAD_FAILED";
    this.statusCode = 502;
  }
}

function getResourceType(mimetype = "") {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "raw";
}

function getUploadOptions(file, options) {
  const resourceType = getResourceType(file.mimetype);

  return {
    folder: options.folder || process.env.CLOUDINARY_FOLDER || "connectly",
    resource_type: resourceType,
    public_id: options.publicId,
    overwrite: options.overwrite ?? false,
    use_filename: options.useFilename ?? true,
    unique_filename: options.uniqueFilename ?? true,
  };
}

async function uploadFileToCloudinary(file, options = {}) {
  if (!file?.path && !Buffer.isBuffer(file?.buffer)) {
    throw new TypeError("A Multer file with a path or buffer is required.");
  }

  const uploadOptions = getUploadOptions(file, options);

  try {
    if (file.path) {
      return await cloudinary.uploader.upload(file.path, uploadOptions);
    }

    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => (error ? reject(error) : resolve(result)),
      );
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new CloudinaryUploadError(
      "Could not upload file to Cloudinary",
      error,
    );
  } finally {
    if (file.path) {
      await fsp.rm(file.path, { force: true }).catch(() => undefined);
    }
  }
}

export {
  CloudinaryUploadError,
  getResourceType,
  upload,
  uploadFileToCloudinary
};

