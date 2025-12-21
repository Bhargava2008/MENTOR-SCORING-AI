// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mentor-scoring-secret"
    );

    // Add user info to request
    req.userId = decoded.userId;
    req.userType = decoded.userType;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Institution Admin Middleware
const institutionAdminMiddleware = (req, res, next) => {
  if (req.userType !== "institution_admin") {
    return res.status(403).json({ error: "Institution admin access required" });
  }
  next();
};

module.exports = { authMiddleware, institutionAdminMiddleware };
