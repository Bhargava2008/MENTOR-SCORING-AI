// controllers/authController.js - COMPLETE WORKING VERSION
const User = require("../models/User");
const Institution = require("../models/Institution");
const Session = require("../models/Session");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT Token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET || "mentor-scoring-secret",
    { expiresIn: "7d" }
  );
};

// Generate unique institution code
function generateInstitutionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Register Individual User
exports.registerIndividual = async (req, res) => {
  try {
    const { email, password, name, institutionCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Validate institution code if provided
    let institutionId = null;
    if (institutionCode && institutionCode.trim() !== "") {
      const institution = await Institution.findOne({
        code: institutionCode.toUpperCase().trim(),
      });
      if (!institution) {
        return res.status(400).json({ error: "Invalid institution code" });
      }
      institutionId = institution._id;

      // Update institution stats
      await Institution.findByIdAndUpdate(institutionId, {
        $inc: { "stats.totalUsers": 1 },
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      userType: "individual",
      institutionCode: institutionCode
        ? institutionCode.toUpperCase().trim()
        : null,
      institutionId,
    });

    // Generate token
    const token = generateToken(user._id, user.userType);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        institutionCode: user.institutionCode,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
};

// Register Institution Admin
exports.registerInstitution = async (req, res) => {
  try {
    const { email, password, name, institutionName, description } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if institution name exists
    const existingInstitution = await Institution.findOne({
      name: institutionName.trim(),
    });
    if (existingInstitution) {
      return res.status(400).json({ error: "Institution name already taken" });
    }

    // Generate unique institution code
    let institutionCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      institutionCode = generateInstitutionCode();
      const existing = await Institution.findOne({ code: institutionCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res
        .status(500)
        .json({ error: "Failed to generate unique institution code" });
    }

    // Create institution with generated code
    const institution = await Institution.create({
      name: institutionName.trim(),
      code: institutionCode,
      description: description || "",
      adminId: null,
      stats: {
        totalUsers: 1, // Count the admin as first user
        totalSessions: 0,
        averageScore: 0,
      },
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      userType: "institution_admin",
      institutionId: institution._id,
    });

    // Update institution with admin ID
    await Institution.findByIdAndUpdate(institution._id, {
      adminId: user._id,
    });

    // Generate token
    const token = generateToken(user._id, user.userType);

    res.status(201).json({
      message: "Institution registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
      institution: {
        id: institution._id,
        name: institution.name,
        code: institution.code,
      },
    });
  } catch (err) {
    console.error("Institution registration error:", err);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.userType);

    // Get institution details if applicable
    let institution = null;
    if (user.institutionId) {
      institution = await Institution.findById(user.institutionId);
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        institutionCode: user.institutionCode,
        avatar: user.avatar,
      },
      institution: institution
        ? {
            id: institution._id,
            name: institution.name,
            code: institution.code,
          }
        : null,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let institution = null;
    if (user.institutionId) {
      institution = await Institution.findById(user.institutionId);
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        institutionCode: user.institutionCode,
        avatar: user.avatar,
      },
      institution: institution
        ? {
            id: institution._id,
            name: institution.name,
            code: institution.code,
          }
        : null,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
};
