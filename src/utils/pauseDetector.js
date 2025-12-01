function timeToSeconds(time) {
  const [h, m, s] = time.split(":");
  const [sec, ms] = s.split(",");
  return Number(h) * 3600 + Number(m) * 60 + Number(sec) + Number(ms) / 1000;
}

exports.detectPauses = (srtContent) => {
  const lines = srtContent.split("\n");

  let timestamps = [];

  for (let line of lines) {
    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((t) => t.trim());
      timestamps.push({
        start,
        end,
        startSec: timeToSeconds(start),
        endSec: timeToSeconds(end),
      });
    }
  }

  let pauses = [];

  for (let i = 0; i < timestamps.length - 1; i++) {
    const current = timestamps[i];
    const next = timestamps[i + 1];

    const pauseDuration = next.startSec - current.endSec;

    if (pauseDuration >= 1.0) {
      pauses.push({
        segmentAfter: i + 1,
        duration: pauseDuration.toFixed(2) + " sec",
        gapStart: current.end,
        gapEnd: next.start,
      });
    }
  }

  return {
    totalPauses: pauses.length,
    pauses,
  };
};
