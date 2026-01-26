/**
 * WebSocket Event Handlers
 * Phase 6: Real-time Features
 *
 * Event definitions and handlers for real-time updates.
 * Should trigger: nodejs-typescript-backend-expert
 */

import { emitToProject, emitToUser, emitToAll, getIO, AuthenticatedSocket } from './server';

// Event Types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Event Payloads
export interface TaskCreatedPayload {
  taskId: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy: string;
  assigneeId?: string;
  timestamp: string;
}

export interface TaskUpdatedPayload {
  taskId: string;
  projectId: string;
  changes: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }>;
  updatedBy: string;
  timestamp: string;
}

export interface TaskAssignedPayload {
  taskId: string;
  projectId: string;
  taskTitle: string;
  assigneeId: string;
  assignedBy: string;
  timestamp: string;
}

export interface TaskDeletedPayload {
  taskId: string;
  projectId: string;
  deletedBy: string;
  timestamp: string;
}

export interface CommentAddedPayload {
  commentId: string;
  taskId: string;
  projectId: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
}

export interface UserPresencePayload {
  userId: string;
  projectId?: string;
  status?: 'online' | 'offline' | 'away';
  timestamp: string;
}

export interface TypingPayload {
  userId: string;
  projectId: string;
  taskId: string;
  isTyping: boolean;
}

export interface ProjectUpdatedPayload {
  projectId: string;
  changes: Partial<{
    name: string;
    description: string;
    status: string;
  }>;
  updatedBy: string;
  timestamp: string;
}

// Event names as constants
export const EVENTS = {
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_ASSIGNED: 'task:assigned',
  TASK_DELETED: 'task:deleted',
  TASK_MOVED: 'task:moved',

  // Comment events
  COMMENT_ADDED: 'comment:added',
  COMMENT_DELETED: 'comment:deleted',

  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_AWAY: 'user:away',
  USER_TYPING: 'user:typing',
  USER_JOINED_PROJECT: 'user:joined_project',
  USER_LEFT_PROJECT: 'user:left_project',

  // Project events
  PROJECT_UPDATED: 'project:updated',
  PROJECT_MEMBERS: 'project:members',

  // Notification events
  NOTIFICATION: 'notification',
} as const;

/**
 * Emit task created event
 */
export function emitTaskCreated(payload: TaskCreatedPayload): void {
  emitToProject(payload.projectId, EVENTS.TASK_CREATED, payload);

  // Notify assignee if different from creator
  if (payload.assigneeId && payload.assigneeId !== payload.createdBy) {
    emitToUser(payload.assigneeId, EVENTS.NOTIFICATION, {
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to "${payload.title}"`,
      taskId: payload.taskId,
      projectId: payload.projectId,
      timestamp: payload.timestamp,
    });
  }
}

/**
 * Emit task updated event
 */
export function emitTaskUpdated(payload: TaskUpdatedPayload): void {
  emitToProject(payload.projectId, EVENTS.TASK_UPDATED, payload);
}

/**
 * Emit task assigned event
 */
export function emitTaskAssigned(payload: TaskAssignedPayload): void {
  emitToProject(payload.projectId, EVENTS.TASK_ASSIGNED, payload);

  // Notify the assignee
  if (payload.assigneeId !== payload.assignedBy) {
    emitToUser(payload.assigneeId, EVENTS.NOTIFICATION, {
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `You have been assigned to "${payload.taskTitle}"`,
      taskId: payload.taskId,
      projectId: payload.projectId,
      timestamp: payload.timestamp,
    });
  }
}

/**
 * Emit task deleted event
 */
export function emitTaskDeleted(payload: TaskDeletedPayload): void {
  emitToProject(payload.projectId, EVENTS.TASK_DELETED, payload);
}

/**
 * Emit task moved event (status change in kanban)
 */
export function emitTaskMoved(
  projectId: string,
  taskId: string,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  movedBy: string
): void {
  emitToProject(projectId, EVENTS.TASK_MOVED, {
    taskId,
    projectId,
    fromStatus,
    toStatus,
    movedBy,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit comment added event
 */
export function emitCommentAdded(payload: CommentAddedPayload): void {
  emitToProject(payload.projectId, EVENTS.COMMENT_ADDED, payload);
}

/**
 * Emit typing indicator
 */
export function emitTyping(payload: TypingPayload): void {
  emitToProject(payload.projectId, EVENTS.USER_TYPING, payload);
}

/**
 * Emit project updated event
 */
export function emitProjectUpdated(payload: ProjectUpdatedPayload): void {
  emitToProject(payload.projectId, EVENTS.PROJECT_UPDATED, payload);
}

/**
 * Send notification to specific user
 */
export function sendNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    link?: string;
    data?: Record<string, unknown>;
  }
): void {
  emitToUser(userId, EVENTS.NOTIFICATION, {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Setup socket event listeners
 * Called when a socket connects
 */
export function setupSocketEventListeners(socket: AuthenticatedSocket): void {
  const io = getIO();
  if (!io || !socket.user) return;

  // Handle typing events
  socket.on(EVENTS.USER_TYPING, (data: { projectId: string; taskId: string; isTyping: boolean }) => {
    socket.to(`project:${data.projectId}`).emit(EVENTS.USER_TYPING, {
      userId: socket.user!.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      isTyping: data.isTyping,
    });
  });

  // Handle task moved (for kanban drag-drop)
  socket.on(EVENTS.TASK_MOVED, (data: { projectId: string; taskId: string; fromStatus: TaskStatus; toStatus: TaskStatus }) => {
    // Broadcast to other users in the project
    socket.to(`project:${data.projectId}`).emit(EVENTS.TASK_MOVED, {
      taskId: data.taskId,
      projectId: data.projectId,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      movedBy: socket.user!.userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle presence updates
  socket.on('presence:update', (status: 'online' | 'away') => {
    socket.projectRooms.forEach((room) => {
      const projectId = room.replace('project:', '');
      socket.to(room).emit(status === 'away' ? EVENTS.USER_AWAY : EVENTS.USER_ONLINE, {
        userId: socket.user!.userId,
        projectId,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

/**
 * Broadcast system announcement to all users
 */
export function broadcastSystemAnnouncement(message: string): void {
  emitToAll(EVENTS.NOTIFICATION, {
    type: 'system',
    title: 'System Announcement',
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create event payload with standard fields
 */
export function createEventPayload<T extends Record<string, unknown>>(
  data: T
): T & { timestamp: string } {
  return {
    ...data,
    timestamp: new Date().toISOString(),
  };
}
