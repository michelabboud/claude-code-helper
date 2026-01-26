/**
 * GET/PUT/DELETE /api/tasks/[id]
 * Phase 2: Backend API - Tasks Routes
 *
 * Get, update, or delete a specific task.
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkProjectAccess } from '@/lib/auth';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const updateTaskSchema = z.object({
  title: z.string().min(2).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id]
 * Get task details with comments and activity
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            teamId: true,
            team: {
              select: { id: true, name: true },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activity: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, task.projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/[id]
 * Update task
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        projectId: true,
        title: true,
        status: true,
        priority: true,
        assigneeId: true,
        project: { select: { teamId: true } },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, existingTask.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate input
    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { assigneeId, ...updateFields } = result.data;

    // If assigning to someone, verify they're a team member
    if (assigneeId !== undefined && assigneeId !== null) {
      const isMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: existingTask.project.teamId, userId: assigneeId },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'Assignee must be a team member' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (updateFields.title !== undefined) updateData.title = updateFields.title;
    if (updateFields.description !== undefined) updateData.description = updateFields.description;
    if (updateFields.status !== undefined) updateData.status = updateFields.status as TaskStatus;
    if (updateFields.priority !== undefined) updateData.priority = updateFields.priority as TaskPriority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (updateFields.dueDate !== undefined) {
      updateData.dueDate = updateFields.dueDate ? new Date(updateFields.dueDate) : null;
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Log activity for significant changes
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (updateFields.status && updateFields.status !== existingTask.status) {
      changes.status = { from: existingTask.status, to: updateFields.status };
    }
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      changes.assignee = { from: existingTask.assigneeId, to: assigneeId };
    }

    if (Object.keys(changes).length > 0) {
      await prisma.activityLog.create({
        data: {
          entityType: 'task',
          entityId: id,
          action: 'updated',
          userId: user.id,
          metadata: changes,
        },
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete task
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { projectId: true, title: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, existingTask.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete task (cascades to comments)
    await prisma.task.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'task',
        entityId: id,
        action: 'deleted',
        userId: user.id,
        metadata: { title: existingTask.title },
      },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
