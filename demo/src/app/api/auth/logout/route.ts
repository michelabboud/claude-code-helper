/**
 * POST /api/auth/logout
 * Phase 2: Backend API - Auth Routes
 *
 * Clears the auth cookie and logs out the user.
 * Should trigger: api-expert
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // Get current user before clearing cookie (for logging)
    const user = await getCurrentUser();

    // Clear the auth cookie
    await clearAuthCookie();

    // Log activity if user was logged in
    if (user) {
      await prisma.activityLog.create({
        data: {
          entityType: 'user',
          entityId: user.id,
          action: 'logged_out',
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
