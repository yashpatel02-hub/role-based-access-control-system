const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { requireAuth, requirePermission } = require('../middleware/auth');

// Global members endpoint with query filtering (e.g. ?project=xyz)
router.get('/', requireAuth, requirePermission('members.view'), memberController.getMembers);
router.post('/', requireAuth, requirePermission('members.add'), memberController.addMember);
router.put('/:memberId', requireAuth, requirePermission('members.edit'), memberController.updateMember);
router.delete('/:memberId', requireAuth, requirePermission('members.remove'), memberController.removeMember);

module.exports = router;
