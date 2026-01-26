/**
 * GET/POST /api/tasks/[id]/comments
 * Phase 2: Backend API - Tasks Routes
 *
 * List and add comments to a task.
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkProjectAccess } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/tasks/[id]/comments
 * List all comments for a task
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: taskId } = await params;

    // Get task to check access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, task.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('List comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: taskId } = await params;
    const body = await request.json();

    // Validate input
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = result.data;

    // Get task to check access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, task.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'task',
        entityId: taskId,
        action: 'commented',
        userId: user.id,
        metadata: { commentId: comment.id, preview: content.substring(0, 100) },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
