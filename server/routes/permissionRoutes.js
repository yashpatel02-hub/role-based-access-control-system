const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, requirePermission('permissions.view'), permissionController.getPermissions);
router.post('/', requireAuth, requirePermission('permissions.manage'), permissionController.createPermission);
router.put('/:id', requireAuth, requirePermission('permissions.manage'), permissionController.updatePermission);
router.delete('/:id', requireAuth, requirePermission('permissions.manage'), permissionController.deletePermission);

module.exports = router;
