// models/Session.js - UPDATED
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    // User References
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },
    institutionCode: String,

    // Original fields
    institutionCode: String,
    mentorName: String,
    role: String,
    videoPath: String,
    audioPath: String,
    transcript: String,
    srt: String,
    detectedLanguage: String,
    pauses: Object,
    audioMetrics: Object,
    bodyLanguageMetrics: Object,
    scoreReport: Object,
    clips: Array,
    rubric: Object,
    feedbackAudio: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
