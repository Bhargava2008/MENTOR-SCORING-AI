const PDFDocument = require("pdfkit");

module.exports = function generateBulkSessionReport(
  res,
  sessions,
  institution,
  range
) {
  // Use a slightly larger bottom margin to prevent NaN issues at page ends
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  doc.pipe(res);

  /* ========= VIBRANT PALETTE ========= */
  const PRIMARY = "#1A237E";
  const SECONDARY = "#0288D1";
  const ACCENT = "#6200EA";
  const SUCCESS = "#2E7D32";
  const DANGER = "#C62828";
  const LIGHT_BG = "#F1F4F9";
  const WHITE = "#FFFFFF";
  const MUTED = "#546E7A";

  // Helper to prevent NaN crashes
  const safeY = () => (isNaN(doc.y) || doc.y === null ? 50 : doc.y);

  /* ========= HEADER ========= */
  doc.rect(0, 0, doc.page.width, 160).fill(PRIMARY);

  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(24)
    .text(institution?.name?.toUpperCase() || "INSTITUTION", 50, 50);

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor(SECONDARY)
    .text("ANALYTICS & PERFORMANCE BULK REPORT", 50, 85);

  doc
    .fontSize(10)
    .fillColor(WHITE)
    .text(`PERIOD: ${range?.from || "Start"} — ${range?.to || "End"}`, 50, 105);

  doc.y = 180; // Set starting position after header

  /* ========= DATA AGGREGATION ========= */
  const grouped = {};
  sessions.forEach((s) => {
    const userId = s.userId?._id?.toString() || "unknown";
    if (!grouped[userId]) {
      grouped[userId] = {
        name: s.userId?.name || "Unknown",
        email: s.userId?.email || "N/A",
        sessions: [],
      };
    }
    grouped[userId].sessions.push(s);
  });

  const rankings = [];

  /* ========= TEACHER SECTIONS ========= */
  Object.values(grouped).forEach((teacher, index) => {
    if (index !== 0) doc.addPage();

    const totalSessions = teacher.sessions.length;
    const scores = teacher.sessions.map((s) => s.scoreReport?.finalScore || 0);
    const avgScore =
      totalSessions > 0
        ? (scores.reduce((a, b) => a + b, 0) / totalSessions).toFixed(2)
        : "0.00";

    rankings.push({
      name: teacher.name,
      email: teacher.email,
      avgScore: Number(avgScore),
      sessions: totalSessions,
    });

    // Dashboard Card
    const cardY = safeY();
    doc.roundedRect(40, cardY, doc.page.width - 80, 90, 10).fill(LIGHT_BG);
    doc.rect(40, cardY, 5, 90).fill(ACCENT); // Accent border

    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(teacher.name, 60, cardY + 20);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(teacher.email, 60, cardY + 40);

    // Score Circle
    const circleX = doc.page.width - 120;
    doc
      .fillColor(WHITE)
      .circle(circleX, cardY + 45, 30)
      .fill();
    doc
      .fillColor(Number(avgScore) < 2.5 ? DANGER : SUCCESS)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(avgScore, circleX - 25, cardY + 37, { width: 50, align: "center" });

    doc.y = cardY + 105;

    // Session List
    teacher.sessions.forEach((s, idx) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50; // Reset Y on new page
      }

      const currentY = safeY();
      const score = s.scoreReport?.finalScore || 0;

      // Background row
      if (idx % 2 === 0)
        doc.rect(50, currentY, doc.page.width - 100, 40).fill("#F9F9F9");

      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Session #${idx + 1}`, 65, currentY + 15);
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .text(
          s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A",
          150,
          currentY + 15
        );

      // Progress Bar
      doc.rect(350, currentY + 18, 100, 5).fill("#EEE");
      doc
        .rect(350, currentY + 18, (score / 5) * 100, 5)
        .fill(score < 2.5 ? DANGER : SUCCESS);

      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .text(score.toFixed(2), 470, currentY + 15);

      doc.y = currentY + 40;
    });
  });

  /* ========= RANKINGS TABLE ========= */
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 100).fill(PRIMARY);
  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("Final Performance Rankings", 50, 40);

  rankings.sort((a, b) => b.avgScore - a.avgScore);

  let startY = 120;
  const rowH = 35;

  // Table Header
  doc
    .fillColor(SECONDARY)
    .rect(40, startY, doc.page.width - 80, rowH)
    .fill();
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(10);
  doc.text("RANK", 60, startY + 12);
  doc.text("TEACHER", 110, startY + 12);
  doc.text("SCORE", 440, startY + 12);
  doc.text("SESSIONS", 500, startY + 12);

  rankings.forEach((r, i) => {
    const y = startY + rowH * (i + 1);

    // Page break logic for ranking table
    if (y > 750) {
      doc.addPage();
      startY = 20; // reset for next rows
      // (Optional: Re-draw header here if needed)
    }

    if (i % 2 !== 0)
      doc
        .fillColor(LIGHT_BG)
        .rect(40, y, doc.page.width - 80, rowH)
        .fill();

    const medal =
      i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : PRIMARY;
    doc
      .fillColor(medal)
      .circle(70, y + 17, 8)
      .fill();

    doc
      .fillColor(PRIMARY)
      .font("Helvetica")
      .fontSize(9)
      .text(r.name, 110, y + 13);
    doc.font("Helvetica-Bold").text(r.avgScore.toFixed(2), 440, y + 13);
    doc.font("Helvetica").text(String(r.sessions), 515, y + 13);
  });

  doc.end();
};
