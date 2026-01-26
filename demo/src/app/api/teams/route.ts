/**
 * GET/POST /api/teams
 * Phase 2: Backend API - Teams Routes
 *
 * List user's teams and create new teams.
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
});

/**
 * GET /api/teams
 * List all teams the current user is a member of
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
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
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('List teams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/teams
 * Create a new team with the current user as owner
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createTeamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = result.data;

    // Create team and add owner as member in a transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name,
          ownerId: user.id,
        },
      });

      // Add owner as team member with OWNER role
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          entityType: 'team',
          entityId: newTeam.id,
          action: 'created',
          userId: user.id,
          metadata: { name },
        },
      });

      return newTeam;
    });

    // Fetch complete team with relations
    const completeTeam = await prisma.team.findUnique({
      where: { id: team.id },
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

    return NextResponse.json({ team: completeTeam }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
