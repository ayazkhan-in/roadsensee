import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import complaintsRoutes from "./complaints.routes.js";
import aiRoutes from "./ai.routes.js";
import adminRoutes from "./admin.routes.js";
import uploadsRoutes from "./uploads.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/complaints", complaintsRoutes);
router.use("/ai", aiRoutes);
router.use("/admin", adminRoutes);
router.use("/uploads", uploadsRoutes);

export default router;
