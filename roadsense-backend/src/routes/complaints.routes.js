import { Router } from "express";
import Complaint from "../models/Complaint.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function toComplaintDto(record) {
  return {
    id: record.complaintId,
    type: record.type,
    description: record.description,
    severity: record.severity,
    status: record.status,
    location: record.location,
    priorityTag: record.priorityTag,
    coordinates: [record.coordinates.lng, record.coordinates.lat],
    imageUrl: record.imageUrl,
    createdAt: record.createdAt,
  };
}

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { type, description, location, lat, lng, imageUrl, severity } = req.body;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (!location || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: "location, lat, lng are required" });
    }

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return res.status(400).json({ success: false, message: "lat and lng must be valid numbers" });
    }

    let complaint;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        complaint = await Complaint.create({
          citizenId: req.user._id,
          type: type || "Pothole",
          description: description || "",
          location,
          coordinates: { lat: parsedLat, lng: parsedLng },
          imageUrl: imageUrl || "",
          severity: severity || "MEDIUM",
          priorityTag: severity || "MEDIUM",
          timeline: [{ state: "SUBMITTED", note: "Complaint submitted" }],
          complaintId: `RS-CMP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        });
        break;
      } catch (error) {
        // Retry only for duplicate key collisions on complaintId.
        if (error?.code !== 11000 || attempt === 2) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: toComplaintDto(complaint),
    });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = req.user.role === "admin" ? {} : { citizenId: req.user._id };
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    const rows = complaints.map(toComplaintDto);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: rows.length,
        page: 1,
        limit: rows.length || 20,
      },
    });
  })
);

router.get(
  "/public/map",
  asyncHandler(async (req, res) => {
    const complaints = await Complaint.find({ status: { $ne: "REJECTED" } }).select(
      "complaintId severity coordinates"
    );

    const summary = { high: 0, medium: 0, low: 0 };
    const pins = complaints.map((item) => {
      if (item.severity === "HIGH") summary.high += 1;
      if (item.severity === "MEDIUM") summary.medium += 1;
      if (item.severity === "LOW") summary.low += 1;

      return {
        id: item.complaintId,
        coordinates: [item.coordinates.lng, item.coordinates.lat],
        severity: item.severity,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        pins,
        heatmapSummary: summary,
      },
    });
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role !== "admin" && complaint.citizenId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, data: toComplaintDto(complaint) });
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role !== "admin" && complaint.citizenId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const allowedFields = ["description", "status", "severity", "priorityTag", "assignedTo", "location"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        complaint[field] = req.body[field];
      }
    });

    if (req.body.status) {
      complaint.timeline.push({ state: req.body.status, note: "Status updated" });
    }

    await complaint.save();
    return res.status(200).json({ success: true, message: "Complaint updated", data: toComplaintDto(complaint) });
  })
);

router.get(
  "/:id/timeline",
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id }).select("citizenId timeline");
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (req.user.role !== "admin" && complaint.citizenId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, data: complaint.timeline });
  })
);

router.post(
  "/:id/duplicate-check",
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const similarComplaints = await Complaint.find({
      complaintId: { $ne: complaint.complaintId },
      "coordinates.lat": { $gte: complaint.coordinates.lat - 0.002, $lte: complaint.coordinates.lat + 0.002 },
      "coordinates.lng": { $gte: complaint.coordinates.lng - 0.002, $lte: complaint.coordinates.lng + 0.002 },
      type: complaint.type,
    }).select("complaintId type location");

    return res.status(200).json({
      success: true,
      data: {
        isDuplicate: similarComplaints.length > 0,
        similarComplaints,
      },
    });
  })
);

router.post(
  "/:id/confirm",
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.status === "SUBMITTED") {
      complaint.status = "VERIFIED";
      complaint.timeline.push({ state: "VERIFIED", note: "Citizen confirmed AI result" });
      await complaint.save();
    }

    return res.status(200).json({
      success: true,
      message: "Complaint confirmed and dispatched",
      data: toComplaintDto(complaint),
    });
  })
);

export default router;
