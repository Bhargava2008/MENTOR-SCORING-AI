// utils/clipExtractor.js

const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

// Helper to convert HH:MM:SS,ms to HH:MM:SS.ms (FFmpeg format)
function formatTimestamp(timestamp) {
  // Ensure we handle potential whitespace and replace comma with dot for FFmpeg compatibility
  return timestamp.trim().replace(",", ".");
}

// Helper to convert HH:MM:SS,ms to total seconds
function timeToSeconds(time) {
  const parts = time.split(":");
  if (parts.length !== 3) return 0; // Basic safety check

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const sParts = parts[2].split(",");
  const s = Number(sParts[0]);
  const ms = Number(sParts[1] || 0) / 1000;

  return h * 3600 + m * 60 + s + ms;
}

// Function to extract a single clip
function extractClip(inputPath, startTime, endTime, outputPath) {
  return new Promise((resolve, reject) => {
    // Calculate the duration in seconds for use with the -t flag
    const startSec = timeToSeconds(startTime);
    const endSec = timeToSeconds(endTime);
    const durationSec = endSec - startSec;

    ffmpeg(inputPath)
      // In clipExtractor.js - update the outputOptions
      .outputOptions([
        // 1. Set start time
        `-ss ${formatTimestamp(startTime)}`,

        // 2. Set duration using -t
        `-t ${durationSec.toFixed(3)}`,

        // 3. Video encoding
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",

        // 4. Audio encoding - IMPORTANT!
        "-c:a aac",
        "-b:a 128k",
        "-ac 2",

        // 5. Force video frame rate
        "-r 30",

        // 6. Map all streams (audio included)
        "-map 0:v", // map video stream
        "-map 0:a?", // map audio stream if exists

        // 7. Force output format
        "-f mp4",
      ])
      .save(outputPath)
      .on("end", () => {
        console.log(`Clip extracted: ${outputPath}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error(
          `Fatal FFmpeg Error for clip ${outputPath}: ${err.message}`
        );
        reject(err);
      });
  }); // <--- The function now correctly returns the promise instance.
}

/**
 * Main function to process the LLM's evidence array and extract clips.
 * @param {string} videoPath - Path to the original video file.
 * @param {Array<Object>} evidenceArray - Array of {issue, timestamp, reason} from LLM.
 * @param {string} sessionId - ID used for creating the output folder.
 * @returns {Array<Object>} List of created clip paths and their reasons.
 */
exports.generateEvidenceClips = async (videoPath, evidenceArray, sessionId) => {
  const outputDir = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "evidence",
    sessionId
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const clipPromises = evidenceArray.map(async (evidence, index) => {
    try {
      // Timestamp format is "Start time --> End time"
      const [startTime, endTime] = evidence.timestamp
        .split("-->")
        .map((t) => t.trim());

      const outputFilename = `${sessionId}_clip${index + 1}.mp4`;
      const outputPath = path.join(outputDir, outputFilename);

      const absolutePath = await extractClip(
        videoPath,
        startTime,
        endTime,
        outputPath
      );

      return {
        issue: evidence.issue,
        reason: evidence.reason,
        path: absolutePath, // Save the path for the frontend
      };
    } catch (err) {
      console.error(`Failed to generate clip ${index + 1}:`, err);
      return null; // Return null if a single clip fails
    }
  });

  // Wait for all clips to process and filter out any failed clips (nulls)
  const results = await Promise.all(clipPromises);
  return results.filter((r) => r !== null);
};
