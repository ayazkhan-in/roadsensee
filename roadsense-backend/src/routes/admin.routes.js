import { Router } from "express";
import Complaint from "../models/Complaint.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get(
  "/officers",
  asyncHandler(async (req, res) => {
    const officers = [
      { id: "officer-rwd", name: "Road Works Lead", email: "roadworks@smc.gov", department: "Road Works" },
      { id: "officer-maint", name: "Maintenance Supervisor", email: "maintenance@smc.gov", department: "Maintenance" },
      { id: "officer-emg", name: "Emergency Response Officer", email: "emergency@smc.gov", department: "Emergency" },
    ];

    res.status(200).json({ success: true, data: officers });
  })
);

router.patch(
  "/complaints/:id/assign-officer",
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const officerId = req.body?.officerId || "officer-rwd";
    const officerMap = {
      "officer-rwd": "Road Works Lead",
      "officer-maint": "Maintenance Supervisor",
      "officer-emg": "Emergency Response Officer",
    };

    complaint.assignedTo = officerMap[officerId] || "Road Works Lead";
    complaint.status = complaint.status === "SUBMITTED" ? "ASSIGNED" : complaint.status;
    complaint.timeline.push({ state: "ASSIGNED", note: `Assigned to ${complaint.assignedTo}` });
    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint ${req.params.id} assigned to officer`,
      data: {
        id: complaint.complaintId,
        status: complaint.status,
        assignedTo: complaint.assignedTo,
      },
    });
  })
);

router.get(
  "/dashboard/summary",
  asyncHandler(async (req, res) => {
    const [totalComplaints, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ["SUBMITTED", "VERIFIED"] } }),
      Complaint.countDocuments({ status: { $in: ["ASSIGNED", "IN_PROGRESS"] } }),
      Complaint.countDocuments({ status: "RESOLVED" }),
    ]);

    res.status(200).json({ success: true, data: { totalComplaints, pending, inProgress, resolved } });
  })
);

router.get(
  "/complaints",
  asyncHandler(async (req, res) => {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: complaints.map((item) => ({
        id: item.complaintId,
        type: item.type,
        status: item.status,
        severity: item.severity,
        location: item.location,
      })),
    });
  })
);

router.patch(
  "/complaints/:id/verify",
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    complaint.status = "VERIFIED";
    complaint.timeline.push({ state: "VERIFIED", note: "Verified by admin" });
    await complaint.save();
    res.status(200).json({ success: true, message: `Complaint ${req.params.id} verified` });
  })
);

router.patch(
  "/complaints/:id/reject",
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    complaint.status = "REJECTED";
    complaint.timeline.push({ state: "REJECTED", note: "Rejected by admin" });
    await complaint.save();
    res.status(200).json({ success: true, message: `Complaint ${req.params.id} rejected` });
  })
);

router.patch(
  "/complaints/:id/assign",
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    complaint.status = "ASSIGNED";
    complaint.assignedTo = req.body?.assignedTo || "Road Works Department";
    complaint.timeline.push({ state: "ASSIGNED", note: `Assigned to ${complaint.assignedTo}` });
    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint ${req.params.id} assigned`,
      data: { assignedTo: complaint.assignedTo },
    });
  })
);

router.patch(
  "/complaints/:id/status",
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    complaint.status = req.body?.status || "IN_PROGRESS";
    complaint.timeline.push({ state: complaint.status, note: "Status updated by admin" });
    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint ${req.params.id} status updated`,
      data: { status: complaint.status },
    });
  })
);

router.get(
  "/priority-queue",
  asyncHandler(async (req, res) => {
    const complaints = await Complaint.find({ status: { $ne: "RESOLVED" } }).sort({ severity: 1, createdAt: 1 });
    const scored = complaints
      .map((item) => {
        const score = item.severity === "HIGH" ? 9.2 : item.severity === "LOW" ? 4.1 : 7.1;
        return {
          id: item.complaintId,
          score,
          reason: `${item.severity} severity at ${item.location}`,
        };
      })
      .sort((a, b) => b.score - a.score);

    res.status(200).json({ success: true, data: scored });
  })
);

router.get(
  "/kanban",
  asyncHandler(async (req, res) => {
    const complaints = await Complaint.find().select("complaintId status");

    const board = {
      reported: complaints.filter((x) => x.status === "SUBMITTED").map((x) => x.complaintId),
      verified: complaints.filter((x) => x.status === "VERIFIED").map((x) => x.complaintId),
      assigned: complaints.filter((x) => x.status === "ASSIGNED").map((x) => x.complaintId),
      inProgress: complaints.filter((x) => x.status === "IN_PROGRESS").map((x) => x.complaintId),
      completed: complaints.filter((x) => x.status === "RESOLVED").map((x) => x.complaintId),
    };

    res.status(200).json({ success: true, data: board });
  })
);

router.patch(
  "/kanban/move",
  asyncHandler(async (req, res) => {
    const { complaintId, toStatus } = req.body;
    if (!complaintId || !toStatus) {
      return res.status(400).json({ success: false, message: "complaintId and toStatus are required" });
    }

    const complaint = await Complaint.findOne({ complaintId });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    complaint.status = toStatus;
    complaint.timeline.push({ state: toStatus, note: "Moved on kanban board" });
    await complaint.save();

    res.status(200).json({ success: true, message: "Kanban item moved", data: { complaintId, toStatus } });
  })
);

router.post("/tasks", (req, res) => {
  res.status(201).json({
    success: true,
    message: "Task created",
    data: {
      id: "TASK-2001",
      ...req.body,
    },
  });
});

router.patch("/tasks/:id", (req, res) => {
  res.status(200).json({
    success: true,
    message: `Task ${req.params.id} updated`,
    data: req.body,
  });
});

router.get(
  "/map",
  asyncHandler(async (req, res) => {
    const clusters = await Complaint.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        clusters: clusters.map((item) => ({ area: item._id, count: item.count })),
      },
    });
  })
);

router.post(
  "/resolution/:complaintId",
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.complaintId });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    complaint.status = "RESOLVED";
    complaint.timeline.push({ state: "RESOLVED", note: "Resolution uploaded by admin" });
    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Resolution submitted",
      data: {
        complaintId: req.params.complaintId,
        status: "RESOLVED",
      },
    });
  })
);

router.get(
  "/activity-log",
  asyncHandler(async (req, res) => {
    const complaints = await Complaint.find().sort({ updatedAt: -1 }).limit(20);

    const logs = complaints.flatMap((item) =>
      item.timeline.slice(-3).map((step) => ({
        time: step.at.toISOString(),
        complaintId: item.complaintId,
        action: step.state,
      }))
    );

    res.status(200).json({ success: true, data: logs.slice(0, 20) });
  })
);

router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: "RESOLVED" });

    const highRiskZoneAggregate = await Complaint.aggregate([
      { $match: { severity: "HIGH" } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const highRiskZone = highRiskZoneAggregate[0]?._id || "N/A";
    const closureRate = total > 0 ? resolved / total : 0;

    res.status(200).json({
      success: true,
      data: {
        averageResolutionHours: 32,
        closureRate,
        highRiskZone,
      },
    });
  })
);

export default router;
