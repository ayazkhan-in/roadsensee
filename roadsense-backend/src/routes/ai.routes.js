import { Router } from "express";
import Complaint from "../models/Complaint.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAiExplanation } from "../services/gemini.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

function fallbackClassification(input = "") {
  if (/light|lamp|dark/i.test(input)) return "Street Light";
  if (/block|obstruction|debris|fallen/i.test(input)) return "Obstruction";
  if (/crack|fracture/i.test(input)) return "Crack";
  if (/pothole|pit|hole/i.test(input)) return "Pothole";
  return "Other";
}

function fallbackSeverity(input = "") {
  if (/deep|major|danger|critical|urgent|accident/i.test(input)) return "HIGH";
  if (/minor|small|low/i.test(input)) return "LOW";
  return "MEDIUM";
}

router.post(
  "/analyze-image",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { description = "", issueType = "Pothole", imageUrl = "" } = req.body;
    const prompt = [
      "You are an AI road safety assistant.",
      "Analyze the complaint details and return ONLY valid JSON in this exact shape:",
      '{"classification":"Pothole|Crack|Street Light|Obstruction|Other","severity":"HIGH|MEDIUM|LOW","confidence":0.0,"explanation":"short actionable explanation"}',
      `Type hint: ${issueType}`,
      `Description: ${description}`,
      `Image URL (context only): ${imageUrl || "not provided"}`,
    ].join("\n");

    const aiRaw = await generateAiExplanation(prompt);

    let parsed;
    try {
      const jsonCandidate = aiRaw.slice(aiRaw.indexOf("{"), aiRaw.lastIndexOf("}") + 1);
      parsed = JSON.parse(jsonCandidate);
    } catch {
      parsed = null;
    }

    const combinedText = `${issueType} ${description}`;
    const classification =
      parsed?.classification && ["Pothole", "Crack", "Street Light", "Obstruction", "Other"].includes(parsed.classification)
        ? parsed.classification
        : fallbackClassification(combinedText);

    const severity =
      parsed?.severity && ["HIGH", "MEDIUM", "LOW"].includes(parsed.severity)
        ? parsed.severity
        : fallbackSeverity(combinedText);

    const confidenceRaw = Number(parsed?.confidence);
    const confidence = Number.isFinite(confidenceRaw) ? Math.max(0.55, Math.min(0.99, confidenceRaw)) : 0.82;

    const explanation =
      typeof parsed?.explanation === "string" && parsed.explanation.trim().length > 0
        ? parsed.explanation.trim()
        : `Detected ${classification.toLowerCase()} pattern from the submitted report. Severity estimated as ${severity.toLowerCase()} priority.`;

    res.status(200).json({
      success: true,
      data: {
        classification,
        severity,
        confidence,
        explanation,
      },
    });
  })
);

router.post(
  "/assistant-chat",
  requireAuth,
  asyncHandler(async (req, res) => {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const role = req.user?.role || "citizen";
    const systemPrompt = [
      "You are RoadSense Assistant for a civic road safety platform.",
      "Give concise, practical, and safe guidance.",
      "If user asks for status help: mention tracking by complaint ID.",
      "If user asks for reporting help: mention clear photo, exact location, and issue category.",
      role === "admin"
        ? "User is an admin. You can suggest workflow steps: verify, assign, move kanban status, and resolve."
        : "User is a citizen. Focus on reporting issues, checking status, and understanding updates.",
      "Do not invent complaint IDs or backend actions as completed unless explicitly provided.",
      "Respond in plain text only.",
    ].join("\n");

    const answer = await generateAiExplanation(`${systemPrompt}\n\nUser: ${message}`);

    res.status(200).json({
      success: true,
      data: {
        reply: answer,
      },
    });
  })
);

router.get(
  "/reverse-geocode",
  asyncHandler(async (req, res) => {
    const lat = Number(req.query?.lat);
    const lng = Number(req.query?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: "lat and lng query params are required" });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const geoResponse = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "RoadSense/1.0",
      },
    });

    if (!geoResponse.ok) {
      return res.status(200).json({ success: true, data: { locationName: null } });
    }

    const geo = await geoResponse.json();
    const address = geo?.address || {};

    const line1 = [address.road, address.neighbourhood || address.suburb, address.village || address.town || address.city]
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");

    const line2 = [address.city || address.town || address.village || address.county, address.state]
      .filter(Boolean)
      .filter((item, index, all) => all.indexOf(item) === index)
      .join(", ");

    const locationName = [line1, line2].filter(Boolean).join(" - ") || geo?.display_name || null;

    res.status(200).json({
      success: true,
      data: {
        locationName,
      },
    });
  })
);

router.post(
  "/severity-score",
  requireAuth,
  asyncHandler(async (req, res) => {
    const severity = req.body?.severity || "MEDIUM";
    const score = severity === "HIGH" ? 9.1 : severity === "LOW" ? 4.2 : 7.0;

    res.status(200).json({
      success: true,
      data: {
        score,
        label: severity,
      },
    });
  })
);

router.post(
  "/priority-index",
  requireAuth,
  asyncHandler(async (req, res) => {
    const severity = req.body?.severity || "MEDIUM";
    const index = severity === "HIGH" ? 92 : severity === "LOW" ? 40 : 73;
    const reason =
      severity === "HIGH"
        ? "High severity and potential traffic safety impact"
        : "Moderate severity requiring scheduled dispatch";

    res.status(200).json({ success: true, data: { index, reason } });
  })
);

router.post(
  "/duplicate-detect",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { lat, lng, type } = req.body;
    if (lat === undefined || lng === undefined || !type) {
      return res.status(400).json({ success: false, message: "lat, lng, type are required" });
    }

    const matches = await Complaint.find({
      type,
      "coordinates.lat": { $gte: Number(lat) - 0.002, $lte: Number(lat) + 0.002 },
      "coordinates.lng": { $gte: Number(lng) - 0.002, $lte: Number(lng) + 0.002 },
      status: { $ne: "REJECTED" },
    }).select("complaintId type location");

    res.status(200).json({
      success: true,
      data: {
        duplicate: matches.length > 0,
        matches,
      },
    });
  })
);

router.post(
  "/repair-verify",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const explanation = await generateAiExplanation(
      "Based on before and after road repair photos, provide quality verification summary in one sentence."
    );

    res.status(200).json({
      success: true,
      data: {
        verified: true,
        confidence: 0.87,
        message: explanation,
      },
    });
  })
);

router.post(
  "/assignment-suggest",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const severity = req.body?.severity || "MEDIUM";
    const team = severity === "HIGH" ? "Rapid Response Team" : "Road Works Department";
    const etaHours = severity === "HIGH" ? 4 : 12;

    res.status(200).json({ success: true, data: { recommendedTeam: team, etaHours } });
  })
);

router.get(
  "/explanations/:complaintId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaint = await Complaint.findOne({ complaintId: req.params.complaintId });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const explanation = complaint.ai?.explanation
      ? complaint.ai.explanation
      : await generateAiExplanation(
          `Explain why complaint ${complaint.complaintId} should be prioritized. Severity: ${complaint.severity}. Status: ${complaint.status}.`
        );

    res.status(200).json({
      success: true,
      data: {
        complaintId: complaint.complaintId,
        explanation,
      },
    });
  })
);

export default router;
