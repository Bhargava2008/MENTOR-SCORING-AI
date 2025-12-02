// utils/professorTTS.js
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const path = require("path");

// Load Google Credentials directly from ENV
let googleCredentials = {};

try {
  googleCredentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  console.log("✅ GOOGLE_CREDENTIALS loaded from env");
} catch (err) {
  console.error("❌ Invalid GOOGLE_CREDENTIALS env:", err.message);
}

// Initialize client
const client = new textToSpeech.TextToSpeechClient({
  credentials: googleCredentials,
});

// Generate instructor audio
exports.generateInstructorAudio = async function (scoreReport, sessionId) {
  try {
    console.log("🎓 Generating Professor Feedback Audio...");

    const correctedText =
      scoreReport.improvementPlan?.correctedVersion ||
      "Improve clarity and reduce filler words for more effective teaching.";

    const ssml = `
<speak>
  <prosody rate="medium">
    Your teaching score is ${scoreReport.finalScore.toFixed(
      1
    )}. Here is an improved explanation.
  </prosody>
  <break time="500ms"/>
  <prosody rate="medium">${cleanText(correctedText)}</prosody>
</speak>`;

    const request = {
      input: { ssml },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-F",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    const ttsFolder = path.join(__dirname, "..", "uploads", "tts");

    if (!fs.existsSync(ttsFolder)) fs.mkdirSync(ttsFolder, { recursive: true });

    const outputFile = path.join(ttsFolder, `${sessionId}_mentor_feedback.mp3`);
    fs.writeFileSync(outputFile, response.audioContent, "binary");

    console.log("✅ TTS Audio saved:", outputFile);
    return outputFile;
  } catch (err) {
    console.error("❌ Professor TTS Error:", err.message);
    return null;
  }
};

// Clean text for SSML
function cleanText(text) {
  return text.replace(/[&<>]/g, "").replace(/\s+/g, " ").trim();
}
