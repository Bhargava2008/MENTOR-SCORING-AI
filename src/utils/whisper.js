const { exec } = require("child_process");
const path = require("path");

exports.runWhisper = (audioPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const whisperExe = path.join(
      __dirname,
      "../../models/whisper/whisper-cli.exe"
    );

    // IMPORTANT: correct model filename
    const modelPath = path.join(
      __dirname,
      "../../models/whisper/ggml-medium.bin"
    );

    const audioAbs = path.resolve(audioPath);
    const outputAbs = path.resolve(outputPath);

    const command = `"${whisperExe}" -m "${modelPath}" -l en -f "${audioAbs}" -otxt -osrt -of "${outputAbs}"`;

    console.log("Running Whisper:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Whisper error:", stderr || error);
        return reject(error);
      }

      resolve({
        txt: outputAbs + ".txt",
        srt: outputAbs + ".srt",
      });
    });
  });
};
