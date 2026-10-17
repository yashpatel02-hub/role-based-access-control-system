const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/stats', requireAuth, requirePermission('dashboard.view'), dashboardController.getDashboardStats);

module.exports = router;
