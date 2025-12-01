const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    institutionCode: String,
    mentorName: String,
    role: String,

    videoPath: String,
    audioPath: String,
    transcript: String,
    srt: String,
    pauses: Object,

    audioMetrics: Object,
    bodyLanguageMetrics: Object,
    rubric: Object,
    scoreReport: Object,
    clips: Array,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
