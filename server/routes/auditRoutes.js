const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, requirePermission('audit.view'), auditController.getAuditLogs);

module.exports = router;
