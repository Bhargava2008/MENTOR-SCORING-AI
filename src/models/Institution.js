// models/Institution.js - CLEAN WORKING VERSION
const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: String,
    logo: String,
    settings: {
      autoApproveUsers: { type: Boolean, default: false },
      maxUsers: { type: Number, default: 50 },
    },
    stats: {
      totalUsers: { type: Number, default: 0 },
      totalSessions: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institution", institutionSchema);
