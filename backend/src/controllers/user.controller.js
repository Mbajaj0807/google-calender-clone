const User = require("../models/User.model");

// PUT /users/profile
const updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "profilePicture", "dateOfBirth", "designation", "timezone"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-passwordHash");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /users/organization  – all members of the current user's org
const getOrganizationMembers = async (req, res) => {
  try {
    const { organizationId } = req.user;
    if (!organizationId) return res.json({ members: [] });

    const members = await User.find({ organizationId }).select("_id name email profilePicture designation dateOfBirth");
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { updateProfile, getUser, getOrganizationMembers };
