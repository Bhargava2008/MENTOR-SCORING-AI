// src/services/whisper.js
const fs = require("fs");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.runWhisper = async (audioPath) => {
  try {
    const fileStream = fs.createReadStream(audioPath);

    console.log("Sending audio/video to Groq Whisper...");

    const response = await groq.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    return {
      text: response.text,
      segments: response.segments || [],
    };
  } catch (err) {
    console.error("Groq Whisper Error:", err);
    throw err;
  }
};
