const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authmiddleware");
console.log("✅ reportRoutes.js loaded");

const {
  downloadSessionReportPDF,
  downloadBulkSessionReportPDF,
} = require("../controllers/reportController");

// Single session PDF
router.get("/session/:sessionId/pdf", authMiddleware, downloadSessionReportPDF);

// 🔥 BULK PDF (THIS WAS MISSING)
router.get(
  "/institution/bulk/pdf",
  authMiddleware,
  (req, res, next) => {
    console.log("🔥 BULK PDF ROUTE HIT");
    next();
  },
  downloadBulkSessionReportPDF
);

module.exports = router;
