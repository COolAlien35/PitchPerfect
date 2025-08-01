const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String, // only for local auth, can be empty for Google-auth users
  googleId: String, // <-- for Firebase auth users
  linkedinUrl: String,
  photo: String,
  resumeDriveUrl: String, // <-- Google Drive file url
  roles: [String], // 'user', 'employer', etc.
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);