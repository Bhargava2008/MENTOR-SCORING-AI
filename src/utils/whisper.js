// utils/whisper.js
const { exec } = require("child_process");
const path = require("path");

exports.runWhisper = (audioPath, outputBase) => {
  return new Promise((resolve, reject) => {
    // Linux binary (Render)
    const whisperBin = path.join(__dirname, "../models/whisper/main");

    // Whisper medium model
    const modelPath = path.join(__dirname, "../models/whisper/ggml-medium.bin");

    const audioAbs = path.resolve(audioPath);
    const outputAbs = path.resolve(outputBase);

    const command = `"${whisperBin}" -m "${modelPath}" -l en -f "${audioAbs}" -otxt -osrt -of "${outputAbs}"`;

    console.log("Running Whisper:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Whisper error:", stderr || error);
        return reject(error);
      }

      resolve({
        txt: outputAbs + ".txt",
        srt: outputAbs + ".srt",
      });
    });
  });
};
