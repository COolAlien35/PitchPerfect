const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // to call Google tokeninfo
const multer = require('multer');
const path = require('path');
const { uploadResumeToDrive } = require('../services/driveService');

const upload = multer({ dest: 'uploads/' });

// ... keep existing exports

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    // 1. Verify with Google
    const googleResp = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { email, name, picture, sub: googleId } = googleResp.data;

    let user = await User.findOne({ email });
    if (!user) {
      // New user. Save in database
      user = await User.create({
        name,
        email,
        googleId,
        photo: picture,
        roles: ['user'],
      });
    } else if (!user.googleId) {
      // Existing email but not yet linked to Google
      user.googleId = googleId;
      user.photo = picture;
      await user.save();
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }
    // JWT for session management
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: '2d' });
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(400).json({ error: 'Google Login failed: ' + err.message });
  }
exports.uploadResume = [
  upload.single('resume'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const file = req.file;
      const driveUrl = await uploadResumeToDrive(file.path, file.mimetype);
      user.resumeDriveUrl = driveUrl;
      await user.save();

      // Delete local temp file
      require('fs').unlinkSync(file.path);

      res.status(200).json({ resumeDriveUrl: driveUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
]
}