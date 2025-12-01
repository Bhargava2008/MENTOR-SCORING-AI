const express = require("express");
const router = express.Router();

const {
  createSession,
  uploadVideo,
  extractAudioFromVideo,
  generateTranscript,
  scoreSession,
  saveBodyMetrics,
} = require("../controllers/sessionController");

const upload = require("../utils/multerConfig");

// Create session
router.post("/create", createSession);

// Upload video
router.post("/:sessionId/upload", upload.single("video"), uploadVideo);

// Extract audio
router.post("/:sessionId/extract-audio", extractAudioFromVideo);

// Generate transcript
router.post("/:sessionId/transcript", generateTranscript);

// Save Body Language Metrics (MediaPipe Data)
router.post("/:sessionId/body-metrics", saveBodyMetrics);

// Final Scoring
router.post("/score/:sessionId", scoreSession);

module.exports = router;
