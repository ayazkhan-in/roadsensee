import { Router } from "express";
import { Readable } from "stream";

import cloudinary from "../config/cloudinary.js";
import { requireAuth } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

function uploadBufferToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "roadsense/complaints" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
}

router.post(
  "/image",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "image file is required" });
    }

    const uploaded = await uploadBufferToCloudinary(req.file.buffer);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        imageUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
      },
    });
  })
);

export default router;
