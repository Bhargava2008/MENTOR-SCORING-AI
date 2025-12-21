// models/User.js - SIMPLE WORKING VERSION
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    userType: {
      type: String,
      enum: ["individual", "institution_admin"],
      default: "individual",
    },
    institutionCode: { type: String, default: null },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },
    avatar: { type: String, default: "" },
    lastLogin: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
