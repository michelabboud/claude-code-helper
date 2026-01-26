/**
 * GET/POST /api/tasks
 * Phase 2: Backend API - Tasks Routes
 *
 * List and create tasks with filtering and assignment.
 * Should trigger: api-expert, nodejs-typescript-backend-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkProjectAccess } from '@/lib/auth';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/tasks
 * List tasks with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    // Parse query params
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const createdByMe = searchParams.get('createdByMe') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Record<string, unknown> = {
      project: {
        team: {
          members: {
            some: { userId: user.id },
          },
        },
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (assignedToMe) {
      where.assigneeId = user.id;
    }

    if (createdByMe) {
      where.creatorId = user.id;
    }

    // Fetch tasks
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, teamId: true },
          },
          assignee: {
            select: { id: true, name: true, avatarUrl: true },
          },
          creator: {
            select: { id: true, name: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        take: Math.min(limit, 100),
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tasks.length < total,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('List tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, title, description, status, priority, assigneeId, dueDate } = result.data;

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // If assigning to someone, verify they're a team member
    if (assigneeId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { teamId: true },
      });

      const isMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: project!.teamId, userId: assigneeId },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'Assignee must be a team member' },
          { status: 400 }
        );
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        assigneeId: assigneeId || null,
        creatorId: user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'task',
        entityId: task.id,
        action: 'created',
        userId: user.id,
        metadata: { title, projectId },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
