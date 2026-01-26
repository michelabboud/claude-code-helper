/**
 * GET /api/auth/me
 * Phase 2: Backend API - Auth Routes
 *
 * Returns the current authenticated user's information.
 * Should trigger: api-expert
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get extended user info including team memberships
    const userWithTeams = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        teamMemberships: {
          select: {
            role: true,
            joinedAt: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
            ownedTeams: true,
          },
        },
      },
    });

    return NextResponse.json({ user: userWithTeams });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
