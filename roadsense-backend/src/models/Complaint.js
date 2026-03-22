import mongoose from "mongoose";
import { randomUUID } from "crypto";

const timelineSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: ["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"],
      required: true,
    },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true, index: true },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["Pothole", "Crack", "Street Light", "Obstruction", "Other"],
      default: "Pothole",
    },
    description: { type: String, default: "" },
    severity: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
    status: {
      type: String,
      enum: ["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"],
      default: "SUBMITTED",
    },
    priorityTag: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
    location: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    imageUrl: { type: String, default: "" },
    assignedTo: { type: String, default: "" },
    ai: {
      confidence: { type: Number, default: 0 },
      explanation: { type: String, default: "" },
      score: { type: Number, default: 0 },
    },
    timeline: { type: [timelineSchema], default: [{ state: "SUBMITTED" }] },
  },
  { timestamps: true }
);

complaintSchema.pre("save", function setComplaintId() {
  if (!this.complaintId) {
    const epoch = Date.now().toString().slice(-6);
    const suffix = randomUUID().slice(0, 6).toUpperCase();
    this.complaintId = `RS-CMP-${epoch}-${suffix}`;
  }
});

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
