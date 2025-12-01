// utils/professorTTS.js
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const path = require("path");

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "..", "google-credentials.json"),
});

exports.generateInstructorAudio = async function (scoreReport, sessionId) {
  try {
    console.log("🎓 Generating Professor Feedback Audio...");

    // Get the corrected text and clean it for SSML
    const correctedText = cleanTextForSSML(
      scoreReport.improvementPlan?.correctedVersion ||
        "Focus on clear explanations with proper structure and minimal filler words."
    );

    const professorFeedback = `<?xml version="1.0"?>
<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis">
  <break time="500ms"/>
  <prosody rate="slow" volume="loud">Greetings, teaching colleague.</prosody>
  <break time="300ms"/>
  <prosody rate="medium">
    I have reviewed your teaching session, and your current score is ${scoreReport.finalScore.toFixed(
      1
    )} out of 5.  
    <break time="400ms"/>
    Since this is below our excellence threshold of 3.5, <emphasis level="moderate">let me demonstrate</emphasis> how we can elevate your teaching delivery.  // CHANGED FROM 7
  </prosody>
  <break time="600ms"/>
  <prosody rate="slow">
    <emphasis level="strong">Listen carefully</emphasis> to this improved version:
  </prosody>
  <break time="500ms"/>
  <prosody rate="medium" volume="medium">
    ${correctedText}
  </prosody>
  <break time="800ms"/>
  <prosody rate="slow" volume="loud">Now, let me highlight the key improvements needed:</prosody>
  <break time="400ms"/>
  <prosody rate="medium">
    You used approximately ${
      scoreReport.audioMetrics?.fillerWords || 0
    } filler words. 
    <break time="300ms"/>
    Practice using deliberate pauses instead of filler sounds.
    <break time="400ms"/>
    Your current pacing of ${
      scoreReport.audioMetrics?.wordsPerMin || 0
    } words per minute could be optimized.
    <break time="400ms"/>
    Focus on maintaining clear lesson structure and improving student engagement throughout your session.
  </prosody>
  <break time="600ms"/>
  <prosody rate="slow" volume="medium">
    Remember, great teaching is a continuous journey of improvement. 
    <break time="300ms"/>
    I am confident you will show remarkable progress in your next session.
  </prosody>
</speak>`;

    const request = {
      input: { ssml: professorFeedback },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-F",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.92,
        pitch: 0.0,
      },
    };

    console.log("📡 Calling Google TTS API with valid SSML...");
    const [response] = await client.synthesizeSpeech(request);

    const ttsFolder = path.join("uploads", "tts");
    if (!fs.existsSync(ttsFolder)) fs.mkdirSync(ttsFolder, { recursive: true });

    const outputFile = path.join(ttsFolder, `${sessionId}_mentor_feedback.mp3`);
    fs.writeFileSync(outputFile, response.audioContent, "binary");

    console.log("✅ Professor audio feedback generated:", outputFile);
    return outputFile;
  } catch (err) {
    console.error("❌ Professor TTS Error:", err.message);

    // Try fallback with regular text instead of SSML
    console.log("🔄 Trying fallback with regular text...");
    return await generateFallbackAudio(scoreReport, sessionId);
  }
};

// Fallback function without SSML
async function generateFallbackAudio(scoreReport, sessionId) {
  try {
    const correctedText =
      scoreReport.improvementPlan?.correctedVersion ||
      "Focus on clear explanations with proper structure.";

    // In generateFallbackAudio function:
    const regularText = `Greetings. Your teaching score is ${scoreReport.finalScore.toFixed(
      1
    )} out of 5. 
Since this is below 3.5, let me demonstrate an improved approach. ${correctedText}  
Key improvements needed: You used ${
      scoreReport.audioMetrics?.fillerWords || 0
    } filler words. 
Your pacing of ${
      scoreReport.audioMetrics?.wordsPerMin || 0
    } words per minute needs adjustment. 
Focus on lesson structure and student engagement. Continue your teaching journey.`;
    const request = {
      input: { text: regularText },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-F",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.92,
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    const ttsFolder = path.join("uploads", "tts");
    if (!fs.existsSync(ttsFolder)) fs.mkdirSync(ttsFolder, { recursive: true });

    const outputFile = path.join(ttsFolder, `${sessionId}_mentor_feedback.mp3`);
    fs.writeFileSync(outputFile, response.audioContent, "binary");

    console.log("✅ Fallback audio generated:", outputFile);
    return outputFile;
  } catch (err) {
    console.error("❌ Fallback also failed:", err.message);
    return null;
  }
}

// Clean text for SSML - remove invalid characters
function cleanTextForSSML(text) {
  if (!text) return "Focus on clear teaching delivery.";

  return text
    .replace(/&/g, " and ")
    .replace(/</g, " ")
    .replace(/>/g, " ")
    .replace(/"/g, " ")
    .replace(/'/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
