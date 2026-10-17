const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const memberController = require('../controllers/memberController');
const { requireAuth, requirePermission } = require('../middleware/auth');

// Project CRUD
router.get('/', requireAuth, requirePermission('projects.view'), projectController.getProjects);
router.post('/', requireAuth, requirePermission('projects.create'), projectController.createProject);
router.get('/:id', requireAuth, requirePermission('projects.view'), projectController.getProjectById);
router.put('/:id', requireAuth, requirePermission('projects.edit'), projectController.updateProject);
router.delete('/:id', requireAuth, requirePermission('projects.delete'), projectController.deleteProject);

// Project Members sub-routes
router.get('/:id/members', requireAuth, requirePermission('members.view'), memberController.getMembers);
router.post('/:id/members', requireAuth, requirePermission('members.add'), memberController.addMember);
router.put('/:id/members/:memberId', requireAuth, requirePermission('members.edit'), memberController.updateMember);
router.delete('/:id/members/:memberId', requireAuth, requirePermission('members.remove'), memberController.removeMember);

module.exports = router;
