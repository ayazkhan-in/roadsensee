import User from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

function readToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select("_id name email role");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid user session" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You are not allowed to access this resource" });
    }

    return next();
  };
}
