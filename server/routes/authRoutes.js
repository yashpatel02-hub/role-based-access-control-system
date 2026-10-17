const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, requirePermission('profile.edit'), authController.updateProfile);
router.post('/change-password', requireAuth, requirePermission('profile.edit'), authController.changePassword);
router.post('/avatar', requireAuth, requirePermission('profile.edit'), uploadProfile.single('avatar'), authController.uploadAvatar);

module.exports = router;
