/**
 * GET/POST /api/projects
 * Phase 2: Backend API - Projects Routes
 *
 * List and create projects within teams.
 * Should trigger: api-expert
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, checkTeamAccess, checkTeamAdmin } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const createProjectSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
});

/**
 * GET /api/projects
 * List all projects the user has access to (optionally filtered by team)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');

    // Build where clause
    const where: Record<string, unknown> = {
      team: {
        members: {
          some: { userId: user.id },
        },
      },
    };

    if (teamId) {
      where.teamId = teamId;
    }

    if (status) {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get task stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await prisma.task.groupBy({
          by: ['status'],
          where: { projectId: project.id },
          _count: true,
        });

        return {
          ...project,
          taskStats: taskStats.reduce(
            (acc, stat) => ({
              ...acc,
              [stat.status]: stat._count,
            }),
            {}
          ),
        };
      })
    );

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create a new project within a team
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { teamId, name, description } = result.data;

    // Check team admin access (only admins can create projects)
    const isAdmin = await checkTeamAdmin(user.id, teamId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required to create projects' },
        { status: 403 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        teamId,
        name,
        description,
        status: 'ACTIVE',
      },
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
        entityId: project.id,
        action: 'created',
        userId: user.id,
        metadata: { name, teamId },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
