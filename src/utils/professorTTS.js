const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

let credentials;

try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} catch (err) {
  console.error("❌ GOOGLE_CREDENTIALS_JSON env variable missing or invalid");
  process.exit(1);
}

const client = new textToSpeech.TextToSpeechClient({
  credentials,
});

async function generateInstructorAudio(text, sessionId) {
  try {
    console.log("🎤 generateInstructorAudio CALLED");
    console.log("Session:", sessionId);
    console.log("Text length:", text?.length);

    if (!text || !sessionId) {
      throw new Error("Text or sessionId missing for TTS");
    }

    const outputDir = path.join(__dirname, "..", "uploads", "tts");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `feedback_${sessionId}.mp3`);

    const request = {
      input: { text },
      voice: {
        languageCode: "en-IN",
        ssmlGender: "NEUTRAL",
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    fs.writeFileSync(outputFile, response.audioContent, "binary");

    console.log("✅ Instructor feedback audio saved:", outputFile);

    return `/uploads/tts/feedback_${sessionId}.mp3`;
  } catch (error) {
    console.error("❌ generateInstructorAudio failed:", error.message);
    throw error;
  }
}

module.exports = {
  generateInstructorAudio,
};
