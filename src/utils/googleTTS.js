// utils/professorTTS.js
const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

// Read google credentials JSON directly from environment variable
let googleCredentials = null;

try {
  googleCredentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  console.error("Invalid GOOGLE_CREDENTIALS env variable");
}

const client = new textToSpeech.TextToSpeechClient({
  credentials: googleCredentials,
});

exports.generateInstructorAudio = async (scoreReport, sessionId) => {
  try {
    const text = scoreReport.improvementPlan?.correctedVersion || "";
    if (!text) return null;

    const outputDir = path.join(__dirname, "../uploads/tts");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${sessionId}.mp3`);

    console.log("🎤 Generating TTS using Google API (from env creds)...");

    const request = {
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "FEMALE" },
      audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await client.synthesizeSpeech(request);

    fs.writeFileSync(outputPath, response.audioContent);

    return `/tts/${sessionId}.mp3`;
  } catch (err) {
    console.error("Professor TTS Error:", err);
    return null;
  }
};
