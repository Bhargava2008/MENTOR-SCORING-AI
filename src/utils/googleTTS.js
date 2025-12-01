// utils/googleTTS.js - ENHANCED VERSION
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const path = require("path");

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "..", "google-credentials.json"),
});

// Available Female Voices (choose one):
const FEMALE_VOICES = {
  NEURAL2_F: "en-US-Neural2-F", // 🏆 Best overall - natural & clear
  NEURAL2_H: "en-US-Neural2-H", // 🎯 Professional & warm
  STUDIO_O: "en-US-Studio-O", // 🎙️ Broadcast quality
  STUDIO_M: "en-US-Studio-M", // 💼 Professional & friendly
  POLYGLOT_1: "en-US-Polyglot-1", // 🌍 Multilingual capable
  WAVENET_A: "en-US-Wavenet-A", // 🎵 Very natural
  WAVENET_C: "en-US-Wavenet-C", // 🏥 Calm & reassuring
  WAVENET_F: "en-US-Wavenet-F", // 👩‍🏫 Teacher-like
};

exports.generateInstructorAudio = async function (text, sessionId) {
  try {
    console.log("🔊 Google TTS - Generating enhanced female voice...");

    // Use shorter, cleaner text for better TTS
    const optimizedText = optimizeTextForTTS(text);
    console.log("Optimized text length:", optimizedText.length);

    const request = {
      input: { text: optimizedText },
      voice: {
        languageCode: "en-US",
        name: FEMALE_VOICES.NEURAL2_F, // 🏆 Best female voice
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.0, // Normal speed
        pitch: 0.0, // Neutral pitch
        volumeGainDb: 0.0, // Normal volume
        sampleRateHertz: 24000, // Higher quality
        effectsProfileId: ["small-bluetooth-speaker-class-device"], // Audio enhancement
      },
    };

    console.log("🎙️ Using voice:", FEMALE_VOICES.NEURAL2_F);
    console.log("📡 Calling Google TTS API...");

    const [response] = await client.synthesizeSpeech(request);
    console.log("✅ Got enhanced audio response");

    const ttsFolder = path.join("uploads", "tts");
    if (!fs.existsSync(ttsFolder)) fs.mkdirSync(ttsFolder, { recursive: true });

    const outputFile = path.join(ttsFolder, `${sessionId}_mentor_feedback.mp3`);
    fs.writeFileSync(outputFile, response.audioContent, "binary");

    const stats = fs.statSync(outputFile);
    console.log(
      `🎵 Enhanced TTS Audio saved: ${outputFile} (${(
        stats.size / 1024
      ).toFixed(1)} KB)`
    );

    return outputFile;
  } catch (err) {
    console.error("❌ Enhanced TTS Error:", err.message);
    return null;
  }
};

// Optimize text for better TTS output
function optimizeTextForTTS(text) {
  if (!text) return "No feedback available.";

  // Extract the most important part (corrected version)
  const correctedMatch = text.match(/correctedVersion[^}]+"([^"]+)"/);
  if (correctedMatch && correctedMatch[1]) {
    return correctedMatch[1];
  }

  // If no corrected version, use improvement plan
  const issuesMatch = text.match(
    /issuesDetected[^\]]+\]([^}]+)correctedVersion/
  );
  if (issuesMatch) {
    return "Focus on these improvements: " + text.substring(0, 1500);
  }

  // Fallback: smart truncation
  return text.length > 2000 ? text.substring(0, 2000) + "..." : text;
}
