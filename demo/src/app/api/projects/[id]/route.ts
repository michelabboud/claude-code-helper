/**
 * GET/PUT/DELETE /api/projects/[id]
 * Phase 2: Backend API - Projects Routes
 *
 * Get, update, or delete a specific project.
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkProjectAccess, checkTeamAdmin } from '@/lib/auth';
import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const updateProjectSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'ON_HOLD', 'COMPLETED']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]
 * Get project details with tasks
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check project access
    const hasAccess = await checkProjectAccess(user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                role: true,
                user: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        },
        tasks: {
          include: {
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
            { status: 'asc' },
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    // Calculate task stats
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: true,
    });

    const stats = {
      total: project?.tasks.length || 0,
      byStatus: taskStats.reduce(
        (acc, stat) => ({
          ...acc,
          [stat.status]: stat._count,
        }),
        {}
      ),
    };

    return NextResponse.json({ project, stats });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * Update project (team admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Get project to check team admin access
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { teamId: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check team admin access
    const isAdmin = await checkTeamAdmin(user.id, existingProject.teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate input
    const result = updateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.status !== undefined) updateData.status = result.data.status as ProjectStatus;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'project',
        entityId: id,
        action: 'updated',
        userId: user.id,
        metadata: result.data,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project (team admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get project to check team admin access
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { teamId: true, name: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check team admin access
    const isAdmin = await checkTeamAdmin(user.id, existingProject.teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Delete project (cascades to tasks)
    await prisma.project.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'project',
        entityId: id,
        action: 'deleted',
        userId: user.id,
        metadata: { name: existingProject.name },
      },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
