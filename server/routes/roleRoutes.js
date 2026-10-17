const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, requirePermission('roles.view'), roleController.getRoles);
router.post('/', requireAuth, requirePermission('roles.create'), roleController.createRole);
router.get('/:id', requireAuth, requirePermission('roles.view'), roleController.getRoleById);
router.put('/:id', requireAuth, requirePermission('roles.edit'), roleController.updateRole);
router.delete('/:id', requireAuth, requirePermission('roles.delete'), roleController.deleteRole);

module.exports = router;
