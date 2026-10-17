const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, requirePermission('users.view'), userController.getUsers);
router.post('/', requireAuth, requirePermission('users.create'), userController.createUser);
router.get('/:id', requireAuth, requirePermission('users.view'), userController.getUserById);
router.put('/:id', requireAuth, requirePermission('users.edit'), userController.updateUser);
router.delete('/:id', requireAuth, requirePermission('users.delete'), userController.deleteUser);
router.patch('/:id/status', requireAuth, requirePermission('users.status'), userController.changeUserStatus);
router.patch('/:id/roles', requireAuth, requirePermission('roles.edit'), userController.updateUserRoles);

module.exports = router;
