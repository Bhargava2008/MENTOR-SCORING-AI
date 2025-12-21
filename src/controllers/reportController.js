// controllers/reportController.js
const Session = require("../models/Session");
const Institution = require("../models/Institution");
const generateSessionReport = require("../utils/pdf/generateSessionReport");
const generateBulkSessionReport = require("../utils/pdf/generateBulkSessionReport");

exports.downloadSessionReportPDF = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const institution = await Institution.findById(session.institutionId);
    if (!institution) {
      return res.status(404).json({ error: "Institution not found" });
    }

    // Generate and stream PDF
    generateSessionReport(res, session, institution);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// Download bulk session reports (date range)
exports.downloadBulkSessionReportPDF = async (req, res) => {
  try {
    const userId = req.userId;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "From and To dates are required" });
    }

    // Find institution
    const institution = await Institution.findOne({ adminId: userId });
    if (!institution) {
      return res.status(404).json({ error: "Institution not found" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Get all sessions in date range
    const sessions = await Session.find({
      institutionId: institution._id,
      createdAt: { $gte: fromDate, $lte: toDate },
    }).populate("userId", "name email");

    if (sessions.length === 0) {
      return res
        .status(404)
        .json({ error: "No sessions found in selected date range" });
    }

    // Generate BULK PDF
    const generateBulkSessionReport = require("../utils/pdf/generateBulkSessionReport");

    generateBulkSessionReport(res, sessions, institution, {
      from,
      to,
    });
  } catch (err) {
    console.error("Bulk PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate bulk report PDF" });
  }
};
