/**
 * Presence Hook
 * Phase 6: Real-time Features
 *
 * Track online users and typing indicators.
 * Should trigger: react-nextjs-expert
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket, useSocketEvent } from './useWebSocket';

// Types
export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface TypingUser {
  userId: string;
  taskId: string;
  startedAt: Date;
}

export interface PresenceState {
  onlineUsers: Map<string, UserPresence>;
  typingUsers: Map<string, TypingUser>;
}

// Typing indicator timeout (stop showing after N seconds without update)
const TYPING_TIMEOUT_MS = 3000;

/**
 * usePresence hook
 * Tracks online users and typing indicators for a project
 */
export function usePresence(projectId: string, token?: string) {
  const socket = useWebSocket({
    auth: token ? { token } : undefined,
    autoConnect: !!token,
  });

  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Join project room when connected
  useEffect(() => {
    if (socket.isConnected && projectId) {
      socket.joinProject(projectId);

      return () => {
        socket.leaveProject(projectId);
      };
    }
  }, [socket.isConnected, projectId, socket]);

  // Handle user online event
  useSocketEvent(socket, 'user:online', (data: { userId: string }) => {
    setOnlineUsers((prev) => {
      const updated = new Map(prev);
      updated.set(data.userId, {
        userId: data.userId,
        status: 'online',
        lastSeen: new Date(),
      });
      return updated;
    });
  }, []);

  // Handle user offline event
  useSocketEvent(socket, 'user:offline', (data: { userId: string }) => {
    setOnlineUsers((prev) => {
      const updated = new Map(prev);
      const user = updated.get(data.userId);
      if (user) {
        updated.set(data.userId, {
          ...user,
          status: 'offline',
          lastSeen: new Date(),
        });
      }
      return updated;
    });
  }, []);

  // Handle user away event
  useSocketEvent(socket, 'user:away', (data: { userId: string }) => {
    setOnlineUsers((prev) => {
      const updated = new Map(prev);
      const user = updated.get(data.userId);
      if (user) {
        updated.set(data.userId, {
          ...user,
          status: 'away',
          lastSeen: new Date(),
        });
      }
      return updated;
    });
  }, []);

  // Handle user joined project
  useSocketEvent(socket, 'user:joined_project', (data: { userId: string }) => {
    setOnlineUsers((prev) => {
      const updated = new Map(prev);
      updated.set(data.userId, {
        userId: data.userId,
        status: 'online',
        lastSeen: new Date(),
      });
      return updated;
    });
  }, []);

  // Handle user left project
  useSocketEvent(socket, 'user:left_project', (data: { userId: string }) => {
    setOnlineUsers((prev) => {
      const updated = new Map(prev);
      updated.delete(data.userId);
      return updated;
    });
  }, []);

  // Handle project members list
  useSocketEvent(socket, 'project:members', (data: { members: string[] }) => {
    setOnlineUsers((prev) => {
      const updated = new Map(prev);
      data.members.forEach((userId) => {
        if (!updated.has(userId)) {
          updated.set(userId, {
            userId,
            status: 'online',
            lastSeen: new Date(),
          });
        }
      });
      return updated;
    });
  }, []);

  // Handle typing indicator
  useSocketEvent(socket, 'user:typing', (data: { userId: string; taskId: string; isTyping: boolean }) => {
    const key = `${data.userId}-${data.taskId}`;

    // Clear existing timeout
    const existingTimeout = typingTimeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      typingTimeoutsRef.current.delete(key);
    }

    if (data.isTyping) {
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        updated.set(key, {
          userId: data.userId,
          taskId: data.taskId,
          startedAt: new Date(),
        });
        return updated;
      });

      // Auto-remove typing indicator after timeout
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
        typingTimeoutsRef.current.delete(key);
      }, TYPING_TIMEOUT_MS);

      typingTimeoutsRef.current.set(key, timeout);
    } else {
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        updated.delete(key);
        return updated;
      });
    }
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, []);

  /**
   * Set typing indicator
   */
  const setTyping = useCallback((taskId: string, isTyping: boolean) => {
    socket.emit('user:typing', { projectId, taskId, isTyping });
  }, [socket, projectId]);

  /**
   * Update own presence status
   */
  const setStatus = useCallback((status: 'online' | 'away') => {
    socket.emit('presence:update', status);
  }, [socket]);

  /**
   * Get online user count
   */
  const onlineCount = Array.from(onlineUsers.values()).filter(
    (u) => u.status === 'online'
  ).length;

  /**
   * Check if a specific user is online
   */
  const isUserOnline = useCallback((userId: string): boolean => {
    const user = onlineUsers.get(userId);
    return user?.status === 'online';
  }, [onlineUsers]);

  /**
   * Get typing users for a specific task
   */
  const getTypingUsersForTask = useCallback((taskId: string): string[] => {
    const users: string[] = [];
    typingUsers.forEach((typingUser) => {
      if (typingUser.taskId === taskId) {
        users.push(typingUser.userId);
      }
    });
    return users;
  }, [typingUsers]);

  return {
    // Socket state
    isConnected: socket.isConnected,
    isConnecting: socket.isConnecting,
    error: socket.error,

    // Presence state
    onlineUsers,
    typingUsers,
    onlineCount,

    // Methods
    setTyping,
    setStatus,
    isUserOnline,
    getTypingUsersForTask,
  };
}

/**
 * Hook for debounced typing indicator
 * Automatically handles start/stop of typing
 */
export function useTypingIndicator(
  presence: ReturnType<typeof usePresence>,
  taskId: string,
  debounceMs: number = 500
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    // Start typing if not already
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      presence.setTyping(taskId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      presence.setTyping(taskId, false);
      typingTimeoutRef.current = null;
    }, debounceMs);
  }, [presence, taskId, debounceMs]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      presence.setTyping(taskId, false);
    }
  }, [presence, taskId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        presence.setTyping(taskId, false);
      }
    };
  }, [presence, taskId]);

  return {
    handleTyping,
    stopTyping,
  };
}

/**
 * Format typing users text
 */
export function formatTypingText(userNames: string[]): string {
  if (userNames.length === 0) {
    return '';
  }
  if (userNames.length === 1) {
    return `${userNames[0]} is typing...`;
  }
  if (userNames.length === 2) {
    return `${userNames[0]} and ${userNames[1]} are typing...`;
  }
  return `${userNames[0]}, ${userNames[1]}, and ${userNames.length - 2} others are typing...`;
}
