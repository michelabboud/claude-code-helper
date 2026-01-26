/**
 * GET/PUT/DELETE /api/teams/[id]
 * Phase 2: Backend API - Teams Routes
 *
 * Get, update, or delete a specific team.
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkTeamAccess, checkTeamAdmin } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/teams/[id]
 * Get team details with members and projects
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check team access
    const hasAccess = await checkTeamAccess(user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Team not found or access denied' },
        { status: 404 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            _count: { select: { tasks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/teams/[id]
 * Update team (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Check admin access
    const isAdmin = await checkTeamAdmin(user.id, id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate input
    const result = updateTeamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const team = await prisma.team.update({
      where: { id },
      data: result.data,
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
        members: {
          select: {
            role: true,
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'team',
        entityId: id,
        action: 'updated',
        userId: user.id,
        metadata: result.data,
      },
    });

    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[id]
 * Delete team (owner only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id },
      select: { ownerId: true, name: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only team owner can delete the team' },
        { status: 403 }
      );
    }

    // Delete team (cascades to members, projects, tasks, etc.)
    await prisma.team.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'team',
        entityId: id,
        action: 'deleted',
        userId: user.id,
        metadata: { name: team.name },
      },
    });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
