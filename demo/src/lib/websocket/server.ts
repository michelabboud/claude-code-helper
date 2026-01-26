/**
 * WebSocket Server
 * Phase 6: Real-time Features
 *
 * Socket.io server setup with authentication and room management.
 * Should trigger: nodejs-typescript-backend-expert
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../auth/jwt';

// Types
export interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
  projectRooms: Set<string>;
}

export interface RoomInfo {
  projectId: string;
  users: Map<string, { userId: string; socketId: string; joinedAt: Date }>;
}

// Server state
let io: Server | null = null;
const projectRooms = new Map<string, RoomInfo>();
const userSockets = new Map<string, Set<string>>(); // userId -> socketIds

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = await verifyAccessToken(token);

      if (!payload) {
        return next(new Error('Invalid or expired token'));
      }

      socket.user = payload;
      socket.projectRooms = new Set();
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${userId} (${socket.id})`);

    // Track user sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Emit user online event
    io?.emit('user:online', { userId });

    // Handle room joins
    socket.on('project:join', (projectId: string) => {
      joinProjectRoom(socket, projectId);
    });

    // Handle room leaves
    socket.on('project:leave', (projectId: string) => {
      leaveProjectRoom(socket, projectId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${userId}:`, error);
    });
  });

  return io;
}

/**
 * Get the WebSocket server instance
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Join a project room
 */
export function joinProjectRoom(socket: AuthenticatedSocket, projectId: string): void {
  if (!socket.user) return;

  const roomName = `project:${projectId}`;
  socket.join(roomName);
  socket.projectRooms.add(roomName);

  // Track room membership
  if (!projectRooms.has(projectId)) {
    projectRooms.set(projectId, {
      projectId,
      users: new Map(),
    });
  }

  const room = projectRooms.get(projectId)!;
  room.users.set(socket.id, {
    userId: socket.user.userId,
    socketId: socket.id,
    joinedAt: new Date(),
  });

  // Notify others in the room
  socket.to(roomName).emit('user:joined_project', {
    projectId,
    userId: socket.user.userId,
    timestamp: new Date().toISOString(),
  });

  // Send current room members to the joining user
  const members = Array.from(room.users.values()).map((u) => u.userId);
  socket.emit('project:members', {
    projectId,
    members: [...new Set(members)], // Unique users
  });

  console.log(`User ${socket.user.userId} joined project ${projectId}`);
}

/**
 * Leave a project room
 */
export function leaveProjectRoom(socket: AuthenticatedSocket, projectId: string): void {
  if (!socket.user) return;

  const roomName = `project:${projectId}`;
  socket.leave(roomName);
  socket.projectRooms.delete(roomName);

  // Update room tracking
  const room = projectRooms.get(projectId);
  if (room) {
    room.users.delete(socket.id);

    // Clean up empty rooms
    if (room.users.size === 0) {
      projectRooms.delete(projectId);
    }
  }

  // Notify others in the room
  socket.to(roomName).emit('user:left_project', {
    projectId,
    userId: socket.user.userId,
    timestamp: new Date().toISOString(),
  });

  console.log(`User ${socket.user.userId} left project ${projectId}`);
}

/**
 * Handle socket disconnection
 */
function handleDisconnect(socket: AuthenticatedSocket): void {
  const userId = socket.user?.userId;

  if (!userId) return;

  console.log(`User disconnected: ${userId} (${socket.id})`);

  // Leave all project rooms
  socket.projectRooms.forEach((roomName) => {
    const projectId = roomName.replace('project:', '');
    leaveProjectRoom(socket, projectId);
  });

  // Remove from user sockets
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socket.id);

    // If user has no more connections, emit offline event
    if (sockets.size === 0) {
      userSockets.delete(userId);
      io?.emit('user:offline', { userId });
    }
  }
}

/**
 * Emit event to a specific project room
 */
export function emitToProject(projectId: string, event: string, data: unknown): void {
  io?.to(`project:${projectId}`).emit(event, data);
}

/**
 * Emit event to a specific user (all their sockets)
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach((socketId) => {
      io?.to(socketId).emit(event, data);
    });
  }
}

/**
 * Emit event to all connected clients
 */
export function emitToAll(event: string, data: unknown): void {
  io?.emit(event, data);
}

/**
 * Get online users for a project
 */
export function getProjectOnlineUsers(projectId: string): string[] {
  const room = projectRooms.get(projectId);
  if (!room) return [];

  const userIds = Array.from(room.users.values()).map((u) => u.userId);
  return [...new Set(userIds)]; // Return unique user IDs
}

/**
 * Check if a user is online
 */
export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(userId);
  return sockets ? sockets.size > 0 : false;
}

/**
 * Get all online users
 */
export function getAllOnlineUsers(): string[] {
  return Array.from(userSockets.keys());
}

/**
 * Force disconnect a user (e.g., after logout)
 */
export function disconnectUser(userId: string): void {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach((socketId) => {
      io?.sockets.sockets.get(socketId)?.disconnect(true);
    });
  }
}

/**
 * Shutdown WebSocket server
 */
export function shutdownWebSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    if (io) {
      io.close(() => {
        io = null;
        projectRooms.clear();
        userSockets.clear();
        resolve();
      });
    } else {
      resolve();
    }
  });
}
