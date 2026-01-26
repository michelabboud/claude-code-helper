/**
 * POST/DELETE /api/teams/[id]/members
 * Phase 2: Backend API - Teams Routes
 *
 * Manage team members (add/remove/update roles).
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkTeamAdmin } from '@/lib/auth';
import { TeamRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

const updateMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/teams/[id]/members
 * Add a new member to the team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: teamId } = await params;
    const body = await request.json();

    // Check admin access
    const isAdmin = await checkTeamAdmin(user.id, teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate input
    const result = addMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = result.data;

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: userToAdd.id },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 409 }
      );
    }

    // Add member
    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: userToAdd.id,
        role: role as TeamRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'team',
        entityId: teamId,
        action: 'member_added',
        userId: user.id,
        metadata: { addedUserId: userToAdd.id, role },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/teams/[id]/members
 * Update a member's role
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: teamId } = await params;
    const body = await request.json();

    // Check admin access
    const isAdmin = await checkTeamAdmin(user.id, teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate input
    const result = updateMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, role } = result.data;

    // Can't change owner's role
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });

    if (team?.ownerId === userId) {
      return NextResponse.json(
        { error: 'Cannot change team owner role' },
        { status: 400 }
      );
    }

    // Update member role
    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: { teamId, userId },
      },
      data: { role: role as TeamRole },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'team',
        entityId: teamId,
        action: 'member_role_changed',
        userId: user.id,
        metadata: { targetUserId: userId, newRole: role },
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[id]/members
 * Remove a member from the team
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: teamId } = await params;
    const body = await request.json();

    // Check admin access
    const isAdmin = await checkTeamAdmin(user.id, teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate input
    const result = removeMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = result.data;

    // Can't remove owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });

    if (team?.ownerId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove team owner' },
        { status: 400 }
      );
    }

    // Remove member
    await prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'team',
        entityId: teamId,
        action: 'member_removed',
        userId: user.id,
        metadata: { removedUserId: userId },
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
