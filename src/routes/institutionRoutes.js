// routes/institutionRoutes.js
const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  institutionAdminMiddleware,
} = require("../middleware/authmiddleware");
const {
  getInstitutionDashboard,
  getUserSessions,
} = require("../controllers/institutionController");

// Protected routes
router.get(
  "/dashboard",
  authMiddleware,
  institutionAdminMiddleware,
  getInstitutionDashboard
);
router.get("/my-sessions", authMiddleware, getUserSessions);

module.exports = router;
