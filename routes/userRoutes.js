const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/google-login', userController.googleLogin);

const { authenticateJWT } = require('../middlewares/auth');
router.post('/upload-resume', authenticateJWT, userController.uploadResume);