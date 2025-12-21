const PDFDocument = require("pdfkit");

module.exports = function generateSessionReport(res, session, institution) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  /* ========= VIBRANT PALETTE ========= */
  const PRIMARY = "#2C3E50"; // Deep Navy
  const SECONDARY = "#3498DB"; // Bright Blue
  const ACCENT = "#8E44AD"; // Royal Purple
  const SUCCESS = "#27AE60"; // Emerald Green
  const DANGER = "#E74C3C"; // Alizarin Red
  const LIGHT_BG = "#F8FAFC"; // Soft Gray/Blue
  const WHITE = "#FFFFFF";

  /* ========= HELPER: ROUNDED RECT ========= */
  const drawBox = (y, height, color = LIGHT_BG) => {
    doc.roundedRect(40, y, doc.page.width - 80, height, 8).fill(color);
  };

  /* ========= HEADER (VIBRANT GRADIENT STYLE) ========= */
  doc.rect(0, 0, doc.page.width, 120).fill(PRIMARY);
  doc.circle(doc.page.width, 0, 150).fill("#34495E"); // Abstract design element

  doc
    .fillColor(WHITE)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(institution?.name || "INSTITUTION", 50, 40);

  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor(SECONDARY)
    .text("MENTOR SESSION EVALUATION REPORT", 50, 70);

  doc.moveDown(4);

  /* ========= SECTION HELPER ========= */
  function section(title, color = SECONDARY) {
    doc.moveDown(1.5);
    const currentY = doc.y;

    // Title Background Bar
    doc.rect(40, currentY, 5, 20).fill(color);

    doc
      .fillColor(PRIMARY)
      .fontSize(15)
      .font("Helvetica-Bold")
      .text(`  ${title.toUpperCase()}`, 50, currentY + 3);

    doc.moveDown(0.5);
  }

  /* ========= SESSION DETAILS (BOXED) ========= */
  section("Session Details", ACCENT);
  const detailsY = doc.y;
  drawBox(detailsY - 5, 65, "#EEF2F7");

  doc.fillColor(PRIMARY).fontSize(11).font("Helvetica-Bold");
  doc
    .text(`Teacher: `, 60, detailsY + 5, { continued: true })
    .font("Helvetica")
    .text(session.mentorName || "N/A");
  doc
    .font("Helvetica-Bold")
    .text(`Role: `, { continued: true })
    .font("Helvetica")
    .text(session.role || "N/A");
  doc
    .font("Helvetica-Bold")
    .text(`Date: `, { continued: true })
    .font("Helvetica")
    .text(
      session.createdAt
        ? new Date(session.createdAt).toLocaleDateString()
        : "N/A"
    );

  /* ========= OVERALL SCORE (BIG BADGE) ========= */
  section("Performance Summary", SUCCESS);
  const score = session.scoreReport?.finalScore || 0;
  const scoreColor = score < 2.5 ? DANGER : SUCCESS;

  const scoreY = doc.y;
  doc.roundedRect(50, scoreY, 120, 45, 10).fill(scoreColor);
  doc
    .fillColor(WHITE)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(`${score.toFixed(2)} / 5`, 60, scoreY + 12);

  doc
    .fillColor(PRIMARY)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("QUALITY RATING", 185, scoreY + 15);
  doc
    .font("Helvetica")
    .text(
      score < 2.5 ? "Needs Immediate Attention" : "Meeting Expectations",
      185,
      scoreY + 28
    );

  /* ========= METRICS GRID (TWO COLUMNS) ========= */
  doc.moveDown(2);
  const metricsY = doc.y;

  // Delivery Column
  doc
    .fillColor(SECONDARY)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Delivery Metrics", 50, metricsY);
  doc.fillColor(PRIMARY).fontSize(10).font("Helvetica");
  const am = session.audioMetrics || {};
  const audioData = [
    `Words/Min: ${am.wordsPerMin ?? "N/A"}`,
    `Filler Words: ${am.fillerWords ?? "N/A"}`,
    `Pause Count: ${am.pauseCount ?? "N/A"}`,
    `Pronunciation: ${am.pronunciationScore ?? "N/A"}/10`,
  ];
  audioData.forEach((text) => doc.moveDown(0.3).text(`• ${text}`));

  // Body Language Column
  const bl = session.bodyLanguageMetrics || {};
  doc
    .fillColor(ACCENT)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Body Language", 300, metricsY);
  doc.fillColor(PRIMARY).fontSize(10).font("Helvetica");
  const bodyData = [
    `Eye Contact: ${bl.eyeContact ?? "N/A"}/10`,
    `Posture: ${bl.posture ?? "N/A"}/10`,
    `Gestures: ${bl.gestures ?? "N/A"}/10`,
    `Facial Exp: ${bl.facialExpressiveness ?? "N/A"}/10`,
  ];
  bodyData.forEach((text, i) =>
    doc.text(`• ${text}`, 300, metricsY + 20 + i * 15)
  );

  /* ========= TRANSCRIPT (STYLIZED BOX) ========= */
  doc.x = 50; // Reset X
  section("Session Transcript", "#95A5A6");
  const transY = doc.y;
  doc
    .fontSize(9)
    .fillColor("#7F8C8D")
    .font("Helvetica-Oblique")
    .text(session.transcript || "No transcript available.", {
      width: 480,
      align: "justify",
    });

  /* ========= RUBRIC EVALUATION (COLOR CARDS) ========= */
  if (doc.y > 600) doc.addPage();
  section("Rubric Evaluation", PRIMARY);

  const rubricScores = session.scoreReport?.scores || [];
  rubricScores.forEach((r) => {
    const cardY = doc.y;
    doc.roundedRect(45, cardY, doc.page.width - 90, 50, 5).fill("#F0F7FF");
    doc
      .fillColor(SECONDARY)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(r.dimension.toUpperCase(), 55, cardY + 10);
    doc.fillColor(PRIMARY).text(`${r.score}/5`, 500, cardY + 10);
    doc
      .fillColor("#444")
      .font("Helvetica")
      .fontSize(9)
      .text(r.justification, 55, cardY + 25, { width: 450 });
    doc.moveDown(2.5);
  });

  /* ========= IMPROVEMENT PLAN (HIGHLIGHTED) ========= */
  if (doc.y > 600) doc.addPage();
  section("Improvement Plan", DANGER);
  const ip = session.scoreReport?.improvementPlan;

  if (ip) {
    doc
      .fillColor(WHITE)
      .rect(40, doc.y, doc.page.width - 80, 20)
      .fill(DANGER);
    doc
      .fillColor(WHITE)
      .font("Helvetica-Bold")
      .text("ACTIONABLE STEPS", 50, doc.y - 15);

    doc.fillColor(PRIMARY).moveDown(1);
    doc.font("Helvetica-Bold").text("Issues Detected:");
    ip.issuesDetected?.forEach((i) => doc.font("Helvetica").text(`• ${i}`));

    doc
      .moveDown()
      .font("Helvetica-Bold")
      .fillColor(SUCCESS)
      .text("Teaching Strategy:");
    ip.teachingStrategy?.forEach((t) =>
      doc.fillColor(PRIMARY).font("Helvetica").text(`→ ${t}`)
    );
  }

  /* ========= FOOTER ========= */
  const bottom = doc.page.height - 50;
  doc.rect(0, bottom - 10, doc.page.width, 60).fill(PRIMARY);
  doc
    .fontSize(9)
    .fillColor(WHITE)
    .text(
      "CONFIDENTIAL SYSTEM-GENERATED REPORT • NO AUDIO CLIPS ATTACHED",
      0,
      bottom,
      { align: "center" }
    );

  doc.end();
};
