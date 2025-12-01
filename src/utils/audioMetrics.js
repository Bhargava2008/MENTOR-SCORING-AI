// List of filler words to detect
const FILLERS = [
  "um",
  "uh",
  "ah",
  "er",
  "hmm",
  "basically",
  "actually",
  "literally",
  "you know",
  "like",
  "so",
  "okay",
  "right",
];

// Count words
function countWords(text) {
  const words = text
    .replace(/\n/g, " ")
    .split(" ")
    .filter((w) => w.trim().length > 0);
  return words.length;
}

// Count sentences
function countSentences(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.length;
}

// Filler word frequency
function detectFillers(text) {
  const found = {};
  const lower = text.toLowerCase();

  for (const filler of FILLERS) {
    const regex = new RegExp("\\b" + filler + "\\b", "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      found[filler] = matches.length;
    }
  }

  return found;
}

// Speaking pace score (0–10)
function getPaceScore(wordsPerMin) {
  if (wordsPerMin < 60) return 3; // too slow
  if (wordsPerMin > 170) return 3; // too fast
  if (wordsPerMin < 90) return 6; // slightly slow
  if (wordsPerMin > 140) return 6; // slightly fast
  return 10; // perfect
}

// Clarity Score = based on pace + fillers + pauses
function getClarityScore(wordsPerMin, fillerCount, totalPauses) {
  let score = 10;

  if (wordsPerMin < 80 || wordsPerMin > 160) score -= 2;
  if (fillerCount > 5) score -= 2;
  if (fillerCount > 10) score -= 4;
  if (totalPauses > 5) score -= 2;

  if (score < 1) score = 1;
  return score;
}

exports.calculateAudioMetrics = function (transcript, durationSec, pauseData) {
  const words = transcript.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // Sentences
  const sentences = transcript
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalSentences = sentences.length || 1;

  // Words per minute
  const wordsPerMin = durationSec
    ? Math.round((totalWords / durationSec) * 60)
    : 0;

  // Filler words
  const fillerList = [
    "um",
    "uh",
    "like",
    "you know",
    "okay",
    "right",
    "basically",
  ];
  let fillerCount = 0;
  let fillerClusters = 0;

  let prevWasFiller = false;

  words.forEach((w) => {
    const normalized = w.toLowerCase().replace(/[^a-z]/g, "");
    if (fillerList.includes(normalized)) {
      fillerCount++;
      if (prevWasFiller) fillerClusters++;
      prevWasFiller = true;
    } else {
      prevWasFiller = false;
    }
  });

  const fillerDensity = fillerCount / totalWords;

  // Pause count
  const longPauses = pauseData?.pauses || [];
  const pauseCount = longPauses.length;

  // -----------------------------
  // Sentence Complexity Score
  // -----------------------------
  const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
  const avgSentenceLength =
    sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

  const longSentences = sentenceLengths.filter((n) => n > 15).length;
  const longSentenceRatio = longSentences / sentenceLengths.length;

  let complexityPenalty = 0;
  if (avgSentenceLength > 15) complexityPenalty += 2;
  if (longSentenceRatio > 0.3) complexityPenalty += 2;
  if (fillerDensity > 0.08) complexityPenalty += 1;

  const unfinishedSentences = sentences.filter(
    (s) => !/[a-zA-Z]$/.test(s)
  ).length;
  if (unfinishedSentences > 0) complexityPenalty += 2;

  const sentenceComplexityScore = Math.max(0, 10 - complexityPenalty);

  // -----------------------------
  // Pronunciation Issues Score
  // -----------------------------
  let repetitionIssues = 0;
  words.forEach((w, i) => {
    if (words[i + 1] && words[i].toLowerCase() === words[i + 1].toLowerCase()) {
      repetitionIssues++;
    }
  });

  const weirdFragments = transcript.match(/(uh+|umm+|yeah yeah|ok+ay)/gi) || [];

  let pronunciationPenalty = 0;
  if (repetitionIssues > 2) pronunciationPenalty += 2;
  if (weirdFragments.length > 3) pronunciationPenalty += 2;

  const pronunciationScore = Math.max(0, 10 - pronunciationPenalty);

  // -----------------------------
  // Speaking Stability Score
  // -----------------------------
  const shortSentences = sentenceLengths.filter((n) => n <= 4).length;
  const shortSentenceRatio = shortSentences / sentenceLengths.length;

  const sentenceVariance = sentenceLengths.reduce(
    (a, b) => a + (b - avgSentenceLength) ** 2,
    0
  );

  let stabilityPenalty = 0;

  if (pauseCount > 4) stabilityPenalty += 2;
  if (fillerClusters > 3) stabilityPenalty += 2;
  if (shortSentenceRatio > 0.4) stabilityPenalty += 2;
  if (sentenceVariance > 120) stabilityPenalty += 2;

  const speakingStabilityScore = Math.max(0, 10 - stabilityPenalty);

  // -----------------------------
  // FINAL OUTPUT
  // -----------------------------
  return {
    totalWords,
    totalSentences,
    fillerWords: fillerCount,
    wordsPerMin,
    pauseCount,
    sentenceComplexityScore,
    pronunciationScore,
    speakingStabilityScore,
  };
};
