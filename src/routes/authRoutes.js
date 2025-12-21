// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerIndividual,
  registerInstitution,
  login,
  getCurrentUser,
} = require("../controllers/authController");

// Public routes
router.post("/register/individual", registerIndividual);
router.post("/register/institution", registerInstitution);
router.post("/login", login);

// Protected route (requires token)
router.get("/me", getCurrentUser);

module.exports = router;
