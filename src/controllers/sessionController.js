// controllers/sessionController.js

const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");
const Session = require("../models/Session");
const { runWhisper } = require("../utils/whisper");
const { detectPauses } = require("../utils/pauseDetector");
const { calculateAudioMetrics } = require("../utils/audioMetrics");
const { cleanTranscript } = require("../utils/transcriptCleaner");
const { getRubricForRole } = require("../utils/rubricGenerator");
const { generateEvidenceClips } = require("../utils/clipExtractor");
const { generateInstructorAudio } = require("../utils/professorTTS");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ffmpeg = require("fluent-ffmpeg");

// ------------------------
// CREATE SESSION
// ------------------------
exports.createSession = async (req, res) => {
  try {
    const session = await Session.create({
      institutionCode: req.body.institutionCode,
      mentorName: req.body.mentorName,
      role: req.body.role || "teacher",
    });
    res.json({
      message: "Session created",
      sessionId: session._id,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create session" });
  }
};

// ------------------------
// UPLOAD VIDEO
// ------------------------
exports.uploadVideo = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) return res.status(404).json({ error: "Session not found" });

    session.videoPath = req.file.path;
    await session.save();

    res.json({
      message: "Video uploaded successfully",
      videoPath: session.videoPath,
    });
  } catch (err) {
    res.status(500).json({ error: "Video upload failed" });
  }
};

// ------------------------
// EXTRACT AUDIO USING FFMPEG
// ------------------------

exports.extractAudioFromVideo = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (!session.videoPath) {
      return res.status(400).json({ error: "Video not uploaded yet" });
    }

    // Create audio directory if it doesn't exist
    const audioDir = path.join(__dirname, "../uploads/audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioOutput = path.join(audioDir, `${Date.now()}.wav`);

    ffmpeg(session.videoPath)
      .output(audioOutput)
      .outputOptions(["-vn", "-acodec pcm_s16le", "-ar 16000", "-ac 1"])
      .on("end", async () => {
        session.audioPath = audioOutput;
        await session.save();

        res.json({
          message: "Audio extracted successfully",
          audioPath: audioOutput,
        });
      })
      .on("error", (err) => {
        console.error("Audio extraction failed:", err);
        res.status(500).json({ error: "Audio extraction failed" });
      })
      .run();
  } catch (err) {
    res.status(500).json({ error: "Audio extraction error" });
  }
};

// ------------------------
// GENERATE TRANSCRIPT + SRT + PAUSE METRICS
// ------------------------

exports.generateTranscript = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.audioPath) {
      return res.status(400).json({ error: "Audio not extracted yet" });
    }

    const audioPath = session.audioPath;
    const transcriptBase = path.join(
      __dirname,
      "../transcripts",
      Date.now().toString()
    );

    const { txt, srt } = await runWhisper(audioPath, transcriptBase);

    if (!fs.existsSync(txt) || !fs.existsSync(srt)) {
      return res
        .status(500)
        .json({ error: "Whisper failed: missing output files" });
    } // READ RAW FILES

    let transcriptRaw = fs.readFileSync(txt, "utf-8").trim();
    const srtContent = fs.readFileSync(srt, "utf-8").trim();

    if (!transcriptRaw.length) {
      return res.status(500).json({ error: "Transcript empty" });
    } // CLEAN TRANSCRIPT

    const transcript = cleanTranscript(transcriptRaw); // EXTRACT DURATION

    const allTimestamps = srtContent.match(/\d{2}:\d{2}:\d{2},\d{3}/g);
    let durationSec = 0;

    if (allTimestamps && allTimestamps.length >= 2) {
      // Convert hh:mm:ss,ms → seconds
      function timeToSec(t) {
        const [h, m, s] = t.split(":");
        const [sec, ms] = s.split(",");
        return (
          Number(h) * 3600 + Number(m) * 60 + Number(sec) + Number(ms) / 1000
        );
      }
      const startSec = timeToSec(allTimestamps[0]);
      const endSec = timeToSec(allTimestamps[allTimestamps.length - 1]);
      durationSec = Math.max(1, endSec - startSec);
    } else {
      console.warn(
        "⚠ Whisper SRT has no usable timestamps → using fallback duration"
      );
      durationSec = Math.max(2, transcript.split(" ").length * 0.4);
    } // PAUSE DETECTION

    let pauseData = { totalPauses: 0, pauses: [] };
    try {
      pauseData = detectPauses(srtContent) || pauseData;
    } catch (err) {
      console.warn("⚠ Pause detection failed, continuing without pauses");
    } // AUDIO METRICS

    const audioMetrics = calculateAudioMetrics(
      transcript,
      durationSec,
      pauseData
    ); // SAVE ALL IN DB

    await Session.findByIdAndUpdate(sessionId, {
      transcript,
      srt: srtContent,
      detectedLanguage: "English",
      pauses: pauseData,
      audioMetrics,
    }); // SEND RESPONSE (using full session data structure)

    res.json({
      message: "Transcript + timestamps generated successfully",
      language: "English",
      transcript,
      pauses: pauseData,
      audioMetrics,
    });
  } catch (err) {
    console.error("generateTranscript ERROR:", err);
    res.status(500).json({ error: "Transcript generation failed" });
  }
};

// ------------------------
// SAVE BODY LANGUAGE METRICS
// ------------------------

exports.saveBodyMetrics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const bodyLanguageMetrics = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        $set: { bodyLanguageMetrics: bodyLanguageMetrics },
      },
      { new: true } // Return the updated document
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      message: "Body language metrics saved successfully",
      bodyLanguageMetrics,
    });
  } catch (err) {
    console.error("Save Body Metrics Error:", err);
    res.status(500).json({ error: "Failed to save body metrics" });
  }
};

exports.scoreSession = async (req, res) => {
  try {
    const { sessionId } = req.params; // Fetch all relevant data for the final report from the DB

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const transcript = session.transcript;
    const audioMetrics = session.audioMetrics || {};
    const bodyLanguageMetrics = session.bodyLanguageMetrics || {};
    const role = session.role || req.body.role || "teacher";
    const rubric = await getRubricForRole(role);

    if (!transcript) {
      return res.status(400).json({ error: "Transcript not generated yet" });
    }
    // ----------------------- // MENTOR-GRADE PROMPT (FINAL VERSION) // -----------------------

    const prompt = `
You are a senior master-trainer who evaluates teachers with timestamp-grounded feedback.

You will receive:
1. Transcript (cleaned speech text)
2. SRT timestamps
3. Audio metrics (WPM, filler count, pauses)
4. A role-specific evaluation rubric

Your tasks:

--------------------------
1. SCORING (0–5)  
--------------------------
Score each rubric dimension from 0–5.
For the "Delivery & Communication" dimension, you must incorporate the Body Language Metrics (e.g., posture score, eye contact) into your justification and final score calculation.
Provide 2–3 sentences explaining WHY.

--------------------------
2. TIMESTAMP EVIDENCE
--------------------------
You **MUST** reference the provided SRT Timestamps and Pauses to ground your feedback.
Identify 3 to 5 critical issues and cite their exact time range (HH:MM:SS,ms).
**CRITICAL PRECISION RULE**: For filler clusters, hesitation, or minor issues, the clip duration should be between 2 and 5 seconds.

For long pauses, use the times listed in the "Pauses" object.
For other issues, use the SRT Timestamps to estimate the start/end time of the problematic segment.

Each evidence item MUST be structured as:
{
  "issue": "Specific problem (e.g., Filler cluster, Vague concept definition)",
  "timestamp": "Start time --> End time (e.g., 00:01:20,500 --> 00:01:25,900)",
  "reason": "Why this segment contributed to the low score (e.g., Contained 'um um like' or lacked technical detail.)"
}
**CRITICAL RULE**: Do NOT return an empty list for 'timestampEvidence'.

--------------------------
2.5. CONCEPTUAL GAP ANALYSIS
--------------------------
Based on the teaching role ("${role}") and the transcript content, identify the 2-3 most critical conceptual elements, prerequisites, or related topics that the teacher **failed to cover** or **misrepresented**.
This proves subject-matter intelligence.

The output for 'conceptualGaps' MUST be an array of objects:
{
  "gap": "Missing or misrepresented conceptual element (e.g., Operator Precedence, Difference between '==' and '.equals()')",
  "impact": "How this omission harms the student's understanding of the subject."
}

--------------------------
3. FINAL SCORE (Weighted)
--------------------------
Use the rubric weights to compute finalScore.

--------------------------
VISUAL METRICS INPUT
--------------------------
Body Language Metrics (0 is bad, 10 is perfect):
${JSON.stringify(bodyLanguageMetrics || {})}

--------------------------
4. IMPROVEMENT PLAN (Mentor-grade)
--------------------------
Return:

{
  "scores": [ /* ... */ ],
  "timestampEvidence": [ /* ... */ ],
  "conceptualGaps": [ /* ... */ ], 
  "finalScore": 0,
  "improvementPlan": {
    "issuesDetected": [...],
    "correctedVersion": "",
    "teachingStrategy": [...],
    "engagementSuggestions": [...],
    "deliveryGuidance": []
  }
}
Rules:
- MUST reference timestamps where applicable.
- correctedVersion must be a perfect teacher-ready explanation.

--------------------------
STRICT OUTPUT RULES
--------------------------
You MUST output ONLY a valid JSON object.
All scores must be on a 0-5 scale.
The 'finalScore' must be on a 0-5 scale.
**DO NOT** use placeholders like "N/A", "Unknown", or an empty string for the 'timestamp' field.
No markdown.
No extra text.
No <think>.
No headings outside JSON.

--------------------------
INPUT STARTS HERE
--------------------------

Rubric:
${JSON.stringify(rubric)}

Transcript:
${transcript}

SRT Timestamps:
${session.srt}

Audio Metrics:
${JSON.stringify(audioMetrics)}

Pauses:
${JSON.stringify(session.pauses)}

--------------------------
VISUAL METRICS INPUT
--------------------------
Body Language Metrics (0 is bad, 10 is perfect):
${JSON.stringify(bodyLanguageMetrics || {})}
`;

    const response = await groq.chat.completions.create({
      model: "groq/compound-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const aiText = response.choices[0].message.content;

    let scoreReport = {};
    try {
      scoreReport = JSON.parse(aiText);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: aiText,
      });
    }

    // -----------------------
    // GENERATE INSTRUCTOR AUDIO IF SCORE < 3.5
    // -----------------------
    let audioFeedbackPath = null;

    if (scoreReport.finalScore < 3.5) {
      const correctedText = scoreReport.improvementPlan?.correctedVersion;

      if (correctedText) {
        audioFeedbackPath = await generateInstructorAudio(
          scoreReport,
          sessionId
        );
        scoreReport.feedbackAudio = audioFeedbackPath;
      } else {
        scoreReport.feedbackAudio = null;
      }
    } else {
      scoreReport.feedbackAudio = null;
    }
    // ----------------------- // PHASE 3: EVIDENCE CLIPS // -----------------------
    let clips = [];
    if (
      scoreReport.timestampEvidence &&
      scoreReport.timestampEvidence.length > 0 &&
      session.videoPath
    ) {
      console.log("Starting evidence clip extraction...");
      clips = await generateEvidenceClips(
        session.videoPath,
        scoreReport.timestampEvidence,
        sessionId
      );

      clips = clips.map((clip) => ({
        ...clip,
        path: clip.path.replace(/\\/g, "/"),
      }));
    }
    // Save final data to the DB (score and clip paths)

    await Session.findByIdAndUpdate(sessionId, {
      scoreReport: scoreReport,
      clips: clips,
      rubric: rubric, // Save the rubric used for transparency
    }); // ----------------------- // PHASE 5: UNIFIED FINAL REPORT JSON // -----------------------

    const finalReport = {
      sessionId: session._id,
      metadata: {
        mentorName: session.mentorName,
        role: session.role,
        institutionCode: session.institutionCode,
        timestamp: session.createdAt,
      },
      transcript: session.transcript,
      audioMetrics: session.audioMetrics, // Pre-calculated WPM, fillers, etc.
      pauses: session.pauses,
      bodyLanguageMetrics: bodyLanguageMetrics || {},
      rubric: rubric,
      scoreReport: scoreReport,
      evidenceClips: clips,
      feedbackAudio: scoreReport.feedbackAudio || null,
    };

    res.json({
      message: "Scoring successful",
      finalReport: finalReport, // <-- Send the unified report
    });
  } catch (err) {
    console.error("Scoring Error:", err);
    res.status(500).json({ error: "Scoring failed" });
  }
};
