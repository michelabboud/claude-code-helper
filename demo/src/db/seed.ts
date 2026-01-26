/**
 * Database Seed Script
 * Phase 1: Foundation & Database
 *
 * Seeds the database with initial test data for development.
 * Run: npx prisma db seed
 */

import { PrismaClient, TeamRole, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create users
  const passwordHash = await hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice Johnson',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob Smith',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      passwordHash,
      name: 'Charlie Brown',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    },
  });

  console.log('✅ Created 3 users');

  // Create teams
  const acmeTeam = await prisma.team.create({
    data: {
      name: 'Acme Development',
      ownerId: alice.id,
    },
  });

  const startupTeam = await prisma.team.create({
    data: {
      name: 'Startup Ventures',
      ownerId: bob.id,
    },
  });

  console.log('✅ Created 2 teams');

  // Add team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: acmeTeam.id, userId: alice.id, role: TeamRole.OWNER },
      { teamId: acmeTeam.id, userId: bob.id, role: TeamRole.ADMIN },
      { teamId: acmeTeam.id, userId: charlie.id, role: TeamRole.MEMBER },
      { teamId: startupTeam.id, userId: bob.id, role: TeamRole.OWNER },
      { teamId: startupTeam.id, userId: alice.id, role: TeamRole.MEMBER },
    ],
  });

  console.log('✅ Added team members');

  // Create projects
  const webAppProject = await prisma.project.create({
    data: {
      teamId: acmeTeam.id,
      name: 'Web Application Redesign',
      description: 'Complete overhaul of the customer-facing web application with modern UI/UX',
      status: ProjectStatus.ACTIVE,
    },
  });

  const mobileProject = await prisma.project.create({
    data: {
      teamId: acmeTeam.id,
      name: 'Mobile App MVP',
      description: 'Minimum viable product for iOS and Android platforms',
      status: ProjectStatus.ACTIVE,
    },
  });

  const apiProject = await prisma.project.create({
    data: {
      teamId: startupTeam.id,
      name: 'API Gateway',
      description: 'Central API gateway for microservices architecture',
      status: ProjectStatus.ON_HOLD,
    },
  });

  console.log('✅ Created 3 projects');

  // Create tasks with various statuses and priorities
  const tasks = await Promise.all([
    // Web App Project tasks
    prisma.task.create({
      data: {
        projectId: webAppProject.id,
        title: 'Design new landing page',
        description: 'Create mockups and wireframes for the new landing page',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        assigneeId: charlie.id,
        creatorId: alice.id,
        dueDate: new Date('2026-02-01'),
      },
    }),
    prisma.task.create({
      data: {
        projectId: webAppProject.id,
        title: 'Implement user authentication',
        description: 'Add OAuth2 and JWT-based authentication system',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        assigneeId: bob.id,
        creatorId: alice.id,
        dueDate: new Date('2026-02-15'),
      },
    }),
    prisma.task.create({
      data: {
        projectId: webAppProject.id,
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeId: alice.id,
        creatorId: alice.id,
        dueDate: new Date('2026-02-20'),
      },
    }),
    prisma.task.create({
      data: {
        projectId: webAppProject.id,
        title: 'Write unit tests',
        description: 'Achieve 80% code coverage with Jest',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.MEDIUM,
        assigneeId: charlie.id,
        creatorId: bob.id,
        dueDate: new Date('2026-03-01'),
      },
    }),

    // Mobile App tasks
    prisma.task.create({
      data: {
        projectId: mobileProject.id,
        title: 'Set up React Native project',
        description: 'Initialize project with TypeScript and navigation',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        assigneeId: bob.id,
        creatorId: alice.id,
      },
    }),
    prisma.task.create({
      data: {
        projectId: mobileProject.id,
        title: 'Build home screen',
        description: 'Create the main dashboard view with task list',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        assigneeId: charlie.id,
        creatorId: alice.id,
      },
    }),

    // API Project tasks
    prisma.task.create({
      data: {
        projectId: apiProject.id,
        title: 'Define API specifications',
        description: 'Create OpenAPI 3.0 spec for all endpoints',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        creatorId: bob.id,
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Add comments to tasks
  await prisma.comment.createMany({
    data: [
      {
        taskId: tasks[0].id,
        userId: alice.id,
        content: 'Great work on the mockups! The color scheme looks perfect.',
      },
      {
        taskId: tasks[0].id,
        userId: charlie.id,
        content: 'Thanks! I updated the mobile responsive designs as well.',
      },
      {
        taskId: tasks[1].id,
        userId: bob.id,
        content: 'Working on the OAuth integration. Should be done by EOD.',
      },
      {
        taskId: tasks[3].id,
        userId: charlie.id,
        content: 'Blocked waiting for the auth module to be completed.',
      },
    ],
  });

  console.log('✅ Added comments');

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        entityType: 'task',
        entityId: tasks[0].id,
        action: 'created',
        userId: alice.id,
        metadata: { title: tasks[0].title },
      },
      {
        entityType: 'task',
        entityId: tasks[0].id,
        action: 'status_changed',
        userId: charlie.id,
        metadata: { from: 'TODO', to: 'DONE' },
      },
      {
        entityType: 'task',
        entityId: tasks[1].id,
        action: 'assigned',
        userId: alice.id,
        metadata: { assignee: bob.name },
      },
      {
        entityType: 'project',
        entityId: webAppProject.id,
        action: 'created',
        userId: alice.id,
        metadata: { name: webAppProject.name },
      },
    ],
  });

  console.log('✅ Created activity logs');

  console.log('\n🎉 Database seeded successfully!');
  console.log(`
Summary:
- Users: 3 (alice, bob, charlie)
- Teams: 2 (Acme Development, Startup Ventures)
- Projects: 3
- Tasks: ${tasks.length}
- Comments: 4
- Activity Logs: 4

Default credentials:
- Email: alice@example.com / bob@example.com / charlie@example.com
- Password: password123
`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
