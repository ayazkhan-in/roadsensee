import dotenv from "dotenv";

dotenv.config();

function readFirstNonEmpty(...values) {
  const hit = values.find((value) => typeof value === "string" && value.trim().length > 0);
  return hit ? hit.trim() : "";
}

const clientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173,http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const env = {
  port: Number.parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: clientUrls[0] || "http://localhost:5173",
  clientUrls,
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "change-me-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "change-me-refresh-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  cloudinaryCloudName: readFirstNonEmpty(
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUD_NAME,
    process.env.CLOUNDINARY_CLOUD_NAME
  ),
  cloudinaryApiKey: readFirstNonEmpty(
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUD_API_KEY,
    process.env.CLOUNDINARY_API_KEY
  ),
  cloudinaryApiSecret: readFirstNonEmpty(
    process.env.CLOUDINARY_API_SECRET,
    process.env.CLOUD_API_SECRET,
    process.env.CLOUNDINARY_API_SECRET
  ),
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiModelName: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
};

export default env;
