const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const AuditLog = require('../models/AuditLog');

const permissionsList = [
  // Dashboard
  { name: 'dashboard.view', description: 'View dashboard metrics and analytics', module: 'dashboard', action: 'view' },

  // Users
  { name: 'users.view', description: 'View user list and details', module: 'users', action: 'view' },
  { name: 'users.create', description: 'Create new users', module: 'users', action: 'create' },
  { name: 'users.edit', description: 'Edit existing user details', module: 'users', action: 'edit' },
  { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
  { name: 'users.status', description: 'Activate or deactivate users', module: 'users', action: 'status' },

  // Roles
  { name: 'roles.view', description: 'View role list and permissions', module: 'roles', action: 'view' },
  { name: 'roles.create', description: 'Create new roles', module: 'roles', action: 'create' },
  { name: 'roles.edit', description: 'Edit roles and assign permissions', module: 'roles', action: 'edit' },
  { name: 'roles.delete', description: 'Delete custom roles', module: 'roles', action: 'delete' },

  // Permissions
  { name: 'permissions.view', description: 'View system permissions list', module: 'permissions', action: 'view' },
  { name: 'permissions.manage', description: 'Manage and modify permissions', module: 'permissions', action: 'manage' },

  // Projects
  { name: 'projects.view', description: 'View projects list and details', module: 'projects', action: 'view' },
  { name: 'projects.create', description: 'Create new projects', module: 'projects', action: 'create' },
  { name: 'projects.edit', description: 'Edit project details and settings', module: 'projects', action: 'edit' },
  { name: 'projects.delete', description: 'Delete projects', module: 'projects', action: 'delete' },

  // Project Members
  { name: 'members.view', description: 'View project members and access details', module: 'members', action: 'view' },
  { name: 'members.add', description: 'Add members to projects', module: 'members', action: 'add' },
  { name: 'members.edit', description: 'Edit member roles and access duration', module: 'members', action: 'edit' },
  { name: 'members.remove', description: 'Remove members from projects', module: 'members', action: 'remove' },

  // Profile
  { name: 'profile.view', description: 'View personal user profile', module: 'profile', action: 'view' },
  { name: 'profile.edit', description: 'Update own profile information', module: 'profile', action: 'edit' },

  // Audit Logs
  { name: 'audit.view', description: 'View system audit trails and logs', module: 'audit', action: 'view' },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Seeding AccessHub database...');

    // 1. Seed or Upsert Permissions
    const permissionDocs = {};
    for (const perm of permissionsList) {
      let doc = await Permission.findOne({ name: perm.name });
      if (!doc) {
        doc = await Permission.create(perm);
      } else {
        doc.description = perm.description;
        doc.module = perm.module;
        doc.action = perm.action;
        await doc.save();
      }
      permissionDocs[perm.name] = doc._id;
    }
    console.log(`✓ Seeded ${Object.keys(permissionDocs).length} permissions`);

    // 2. Seed Roles
    const allPermIds = Object.values(permissionDocs);

    const adminPermIds = allPermIds.filter((id) => {
      const p = Object.keys(permissionDocs).find((key) => permissionDocs[key].toString() === id.toString());
      return p !== 'permissions.manage';
    });

    const managerPermIds = [
      permissionDocs['dashboard.view'],
      permissionDocs['projects.view'],
      permissionDocs['projects.edit'],
      permissionDocs['members.view'],
      permissionDocs['members.add'],
      permissionDocs['members.edit'],
      permissionDocs['members.remove'],
      permissionDocs['profile.view'],
      permissionDocs['profile.edit'],
    ];

    const developerPermIds = [
      permissionDocs['dashboard.view'],
      permissionDocs['projects.view'],
      permissionDocs['members.view'],
      permissionDocs['profile.view'],
      permissionDocs['profile.edit'],
    ];

    const viewerPermIds = [
      permissionDocs['dashboard.view'],
      permissionDocs['projects.view'],
      permissionDocs['members.view'],
      permissionDocs['profile.view'],
    ];

    const rolesData = [
      {
        name: 'Super Admin',
        description: 'Full system-wide administrative control without limitations',
        permissions: allPermIds,
        isSystem: true,
      },
      {
        name: 'Admin',
        description: 'Manage users, projects, members, and view audit logs',
        permissions: adminPermIds,
        isSystem: true,
      },
      {
        name: 'Manager',
        description: 'Manage assigned projects, team members, and access levels',
        permissions: managerPermIds,
        isSystem: true,
      },
      {
        name: 'Developer',
        description: 'View assigned projects and project members, manage own profile',
        permissions: developerPermIds,
        isSystem: true,
      },
      {
        name: 'Viewer',
        description: 'Read-only access to dashboard and assigned projects',
        permissions: viewerPermIds,
        isSystem: true,
      },
    ];

    const roleDocs = {};
    for (const r of rolesData) {
      let doc = await Role.findOne({ name: r.name });
      if (!doc) {
        doc = await Role.create(r);
      } else {
        doc.description = r.description;
        doc.permissions = r.permissions;
        doc.isSystem = r.isSystem;
        await doc.save();
      }
      roleDocs[r.name] = doc;
    }
    console.log(`✓ Seeded ${Object.keys(roleDocs).length} default roles`);

    // 3. Seed Users
    const usersData = [
      {
        name: 'Konstantin Konstantinopolsky',
        email: 'admin@example.com',
        username: 'konstantinkonstantinopolsky',
        password: 'Admin@123',
        roles: [roleDocs['Super Admin']._id],
        status: 'active',
        about: 'Principal system architect & Super Administrator for AccessHub platform.',
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah.admin@accesshub.io',
        username: 'sjenkins',
        password: 'Password@123',
        roles: [roleDocs['Admin']._id],
        status: 'active',
        about: 'Lead operations manager maintaining project infrastructure.',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.manager@accesshub.io',
        username: 'mvance',
        password: 'Password@123',
        roles: [roleDocs['Manager']._id],
        status: 'active',
        about: 'Engineering Manager leading the Core Banking initiatives.',
      },
      {
        name: 'Elena Rostova',
        email: 'elena.dev@accesshub.io',
        username: 'erostova',
        password: 'Password@123',
        roles: [roleDocs['Developer']._id],
        status: 'active',
        about: 'Senior Backend Engineer working on distributed database layers.',
      },
      {
        name: 'David Kim',
        email: 'david.dev@accesshub.io',
        username: 'dkim',
        password: 'Password@123',
        roles: [roleDocs['Developer']._id],
        status: 'active',
        about: 'Frontend React & UI/UX specialist.',
      },
      {
        name: 'Maya Patel',
        email: 'maya.viewer@accesshub.io',
        username: 'mpatel',
        password: 'Password@123',
        roles: [roleDocs['Viewer']._id],
        status: 'active',
        about: 'Product Auditor reviewing access and compliance workflows.',
      },
      {
        name: 'Alex Thorne',
        email: 'alex.manager@accesshub.io',
        username: 'athorne',
        password: 'Password@123',
        roles: [roleDocs['Manager']._id],
        status: 'active',
        about: 'Project Director overseeing NextGen Cloud portal rollouts.',
      },
      {
        name: 'Jessica Wu',
        email: 'jessica.dev@accesshub.io',
        username: 'jwu',
        password: 'Password@123',
        roles: [roleDocs['Developer']._id],
        status: 'active',
        about: 'Full stack engineer focusing on RBAC middleware and API gateways.',
      },
      {
        name: 'Liam O\'Connor',
        email: 'liam.viewer@accesshub.io',
        username: 'loconnor',
        password: 'Password@123',
        roles: [roleDocs['Viewer']._id],
        status: 'inactive',
        about: 'External security consultant (contract concluded).',
      },
      {
        name: 'Sophia Martinez',
        email: 'sophia.dev@accesshub.io',
        username: 'smartinez',
        password: 'Password@123',
        roles: [roleDocs['Developer']._id],
        status: 'active',
        about: 'DevOps & CI/CD deployment pipeline engineer.',
      },
    ];

    const userDocs = {};
    for (const u of usersData) {
      let doc = await User.findOne({ email: u.email });
      if (!doc) {
        doc = await User.create(u);
      } else {
        doc.name = u.name;
        doc.username = u.username;
        doc.roles = u.roles;
        doc.status = u.status;
        doc.about = u.about;
        // Don't overwrite password if already modified unless re-saving
        await doc.save();
      }
      userDocs[u.email] = doc;
    }
    console.log(`✓ Seeded ${Object.keys(userDocs).length} users`);

    // 4. Seed Projects
    const projectsData = [
      {
        name: 'Project 007',
        description: 'Core banking transaction system and secure asset gateway',
        status: 'active',
        createdBy: userDocs['admin@example.com']._id,
      },
      {
        name: 'NextGen Cloud Portal',
        description: 'Multi-tenant cloud infrastructure management dashboard',
        status: 'active',
        createdBy: userDocs['sarah.admin@accesshub.io']._id,
      },
      {
        name: 'Legacy Data Migration',
        description: 'Cross-region archival and database transition pipeline',
        status: 'completed',
        createdBy: userDocs['marcus.manager@accesshub.io']._id,
      },
    ];

    const projectDocs = {};
    for (const p of projectsData) {
      let doc = await Project.findOne({ name: p.name });
      if (!doc) {
        doc = await Project.create(p);
      } else {
        doc.description = p.description;
        doc.status = p.status;
        await doc.save();
      }
      projectDocs[p.name] = doc;
    }
    console.log(`✓ Seeded ${Object.keys(projectDocs).length} projects`);

    // 5. Seed Project Memberships
    // Dates helpers
    const now = new Date();
    const in12Months = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const in2Years = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const expiredDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const memberships = [
      // Project 007 members
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['admin@example.com']._id,
        role: roleDocs['Super Admin']._id,
        accessExpiresAt: in2Years,
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['sarah.admin@accesshub.io']._id,
        role: roleDocs['Admin']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['marcus.manager@accesshub.io']._id,
        role: roleDocs['Manager']._id,
        accessExpiresAt: in3Days, // Expiring soon
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['elena.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['david.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['maya.viewer@accesshub.io']._id,
        role: roleDocs['Viewer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['jessica.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in5Days, // Expiring soon
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['sophia.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Project 007']._id,
        user: userDocs['liam.viewer@accesshub.io']._id,
        role: roleDocs['Viewer']._id,
        accessExpiresAt: expiredDate, // Expired
      },

      // NextGen Cloud Portal members
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['admin@example.com']._id,
        role: roleDocs['Super Admin']._id,
        accessExpiresAt: in2Years,
      },
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['sarah.admin@accesshub.io']._id,
        role: roleDocs['Admin']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['alex.manager@accesshub.io']._id,
        role: roleDocs['Manager']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['elena.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['david.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in3Days,
      },
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['jessica.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['NextGen Cloud Portal']._id,
        user: userDocs['maya.viewer@accesshub.io']._id,
        role: roleDocs['Viewer']._id,
        accessExpiresAt: expiredDate,
      },

      // Legacy Data Migration members
      {
        project: projectDocs['Legacy Data Migration']._id,
        user: userDocs['admin@example.com']._id,
        role: roleDocs['Super Admin']._id,
        accessExpiresAt: null, // Unlimited / No expiration
      },
      {
        project: projectDocs['Legacy Data Migration']._id,
        user: userDocs['marcus.manager@accesshub.io']._id,
        role: roleDocs['Manager']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Legacy Data Migration']._id,
        user: userDocs['alex.manager@accesshub.io']._id,
        role: roleDocs['Manager']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Legacy Data Migration']._id,
        user: userDocs['sophia.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
      {
        project: projectDocs['Legacy Data Migration']._id,
        user: userDocs['david.dev@accesshub.io']._id,
        role: roleDocs['Developer']._id,
        accessExpiresAt: in12Months,
      },
    ];

    let membershipCount = 0;
    for (const m of memberships) {
      await ProjectMember.findOneAndUpdate(
        { project: m.project, user: m.user },
        { role: m.role, accessExpiresAt: m.accessExpiresAt, joinedAt: new Date() },
        { upsert: true, returnDocument: 'after' }
      );
      membershipCount++;
    }
    console.log(`✓ Seeded ${membershipCount} project memberships`);

    // 6. Seed Initial Audit Logs
    const initialLogs = [
      {
        user: userDocs['admin@example.com']._id,
        action: 'USER_CREATED',
        targetType: 'User',
        targetId: userDocs['admin@example.com']._id.toString(),
        description: 'System initialization and Super Admin provisioned',
        ipAddress: '127.0.0.1',
      },
      {
        user: userDocs['admin@example.com']._id,
        action: 'ROLE_CREATED',
        targetType: 'Role',
        targetId: roleDocs['Super Admin']._id.toString(),
        description: 'System roles and permission sets established',
        ipAddress: '127.0.0.1',
      },
      {
        user: userDocs['admin@example.com']._id,
        action: 'PROJECT_CREATED',
        targetType: 'Project',
        targetId: projectDocs['Project 007']._id.toString(),
        description: 'Created primary project: Project 007',
        ipAddress: '127.0.0.1',
      },
      {
        user: userDocs['sarah.admin@accesshub.io']._id,
        action: 'MEMBER_ADDED',
        targetType: 'ProjectMember',
        targetId: projectDocs['Project 007']._id.toString(),
        description: 'Added engineering team to Project 007',
        ipAddress: '127.0.0.1',
      },
    ];

    for (const log of initialLogs) {
      const existing = await AuditLog.findOne({ description: log.description });
      if (!existing) {
        await AuditLog.create(log);
      }
    }
    console.log(`✓ Seeded initial audit logs`);

    console.log('\n==========================================');
    console.log('✅ AccessHub Database seeded successfully!');
    console.log('Default credentials:');
    console.log('Super Admin: admin@example.com / Admin@123');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
