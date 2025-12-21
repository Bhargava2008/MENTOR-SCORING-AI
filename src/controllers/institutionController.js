// controllers/institutionController.js
const Institution = require("../models/Institution");
const User = require("../models/User");
const Session = require("../models/Session");

// Get Institution Dashboard
exports.getInstitutionDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Get institution for this admin
    const institution = await Institution.findOne({ adminId: userId });
    if (!institution) {
      return res.status(404).json({ error: "Institution not found" });
    }

    // Get all users in this institution
    const users = await User.find({ institutionId: institution._id })
      .select("name email userType lastLogin")
      .sort({ createdAt: -1 });

    // Get all sessions for this institution
    const sessions = await Session.find({ institutionId: institution._id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate statistics
    const totalSessions = await Session.countDocuments({
      institutionId: institution._id,
    });
    const totalUsers = await User.countDocuments({
      institutionId: institution._id,
    });

    // Calculate average score
    const avgScoreResult = await Session.aggregate([
      {
        $match: {
          institutionId: institution._id,
          "scoreReport.finalScore": { $exists: true },
        },
      },
      { $group: { _id: null, avgScore: { $avg: "$scoreReport.finalScore" } } },
    ]);
    const averageScore =
      avgScoreResult.length > 0 ? avgScoreResult[0].avgScore.toFixed(2) : 0;

    // Get recent activity
    const recentActivity = await Session.find({
      institutionId: institution._id,
    })
      .populate("userId", "name")
      .select("mentorName role scoreReport.finalScore createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get performance trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await Session.aggregate([
      {
        $match: {
          institutionId: institution._id,
          createdAt: { $gte: thirtyDaysAgo },
          "scoreReport.finalScore": { $exists: true },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgScore: { $avg: "$scoreReport.finalScore" },
          sessionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      institution: {
        id: institution._id,
        name: institution.name,
        code: institution.code,
        description: institution.description,
        createdAt: institution.createdAt,
      },
      stats: {
        totalUsers,
        totalSessions,
        averageScore,
        activeUsers: users.filter(
          (u) => u.lastLogin > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      },
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        userType: u.userType,
        lastLogin: u.lastLogin,
        isActive: u.lastLogin > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })),
      recentSessions: sessions.map((s) => ({
        id: s._id,
        mentorName: s.mentorName,
        role: s.role,
        score: s.scoreReport?.finalScore || 0,
        createdAt: s.createdAt,
        user: s.userId
          ? {
              name: s.userId.name,
              email: s.userId.email,
            }
          : null,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a._id,
        sessionId: a._id,
        mentor: a.mentorName,
        role: a.role,
        score: a.scoreReport?.finalScore || 0,
        date: a.createdAt,
        user: a.userId?.name || "Unknown",
      })),

      trends: trendData,
      performanceMetrics: {
        // Top performers
        topPerformers: await this.getTopPerformers(institution._id),
        // Areas needing improvement
        weakAreas: await this.getWeakAreas(institution._id),
      },
    });
  } catch (err) {
    console.error("Institution dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

// Get top performers
exports.getTopPerformers = async (institutionId) => {
  const topSessions = await Session.aggregate([
    {
      $match: {
        institutionId: institutionId,
        "scoreReport.finalScore": { $exists: true },
      },
    },
    {
      $sort: { "scoreReport.finalScore": -1 },
    },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  ]);

  return topSessions.map((s) => ({
    mentorName: s.mentorName,
    score: s.scoreReport.finalScore,
    role: s.role,
    date: s.createdAt,
    userName: s.user?.name || "Unknown",
  }));
};

// Get weak areas
exports.getWeakAreas = async (institutionId) => {
  const weakSessions = await Session.aggregate([
    {
      $match: {
        institutionId: institutionId,
        "scoreReport.finalScore": { $exists: true, $lt: 2.5 },
      },
    },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  ]);

  return weakSessions.map((s) => ({
    mentorName: s.mentorName,
    score: s.scoreReport.finalScore,
    role: s.role,
    date: s.createdAt,
    userName: s.user?.name || "Unknown",
    issues: s.scoreReport.improvementPlan?.issuesDetected || [],
  }));
};

// Get User Sessions (for individual users)
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .select(
        "mentorName role scoreReport.finalScore createdAt clips feedbackAudio"
      );

    // Calculate user statistics
    const totalSessions = sessions.length;
    const avgScore =
      sessions.length > 0
        ? (
            sessions.reduce(
              (sum, s) => sum + (s.scoreReport?.finalScore || 0),
              0
            ) / totalSessions
          ).toFixed(2)
        : 0;

    res.json({
      totalSessions,
      averageScore: avgScore,
      sessions: sessions.map((s) => ({
        id: s._id,
        mentorName: s.mentorName,
        role: s.role,
        score: s.scoreReport?.finalScore || 0,
        date: s.createdAt,
        hasClips: s.clips && s.clips.length > 0,
        hasFeedbackAudio: !!s.feedbackAudio,
      })),
    });
  } catch (err) {
    console.error("Get user sessions error:", err);
    res.status(500).json({ error: "Failed to get sessions" });
  }
};
