const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authmiddleware");

const {
  createSession,
  uploadVideo,
  extractAudioFromVideo,
  generateTranscript,
  scoreSession,
  saveBodyMetrics,
  getSessionReport, // ✅ NEW
} = require("../controllers/sessionController");

const upload = require("../utils/multerConfig");

// Create session
router.post("/create", authMiddleware, createSession);

// Upload video
router.post(
  "/:sessionId/upload",
  authMiddleware,
  upload.single("video"),
  uploadVideo
);

// Extract audio
router.post("/:sessionId/extract-audio", authMiddleware, extractAudioFromVideo);

// Generate transcript
router.post("/:sessionId/transcript", authMiddleware, generateTranscript);

// Save body metrics
router.post("/:sessionId/body-metrics", authMiddleware, saveBodyMetrics);

// Final scoring
router.post("/score/:sessionId", authMiddleware, scoreSession);

// ✅ GET REPORT (THIS FIXES report.html)
router.get("/:sessionId/report", authMiddleware, getSessionReport);

module.exports = router;
