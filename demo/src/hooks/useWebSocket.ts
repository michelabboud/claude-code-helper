/**
 * WebSocket Client Hook
 * Phase 6: Real-time Features
 *
 * React hook for WebSocket connection with auto-reconnect.
 * Should trigger: react-nextjs-expert
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
export interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  auth?: {
    token: string;
  };
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  reconnectAttempt: number;
}

export type EventCallback<T = unknown> = (data: T) => void;

const DEFAULT_OPTIONS: WebSocketOptions = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
};

/**
 * useWebSocket hook
 * Manages WebSocket connection with auto-reconnect
 */
export function useWebSocket(options: WebSocketOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempt: 0,
  });

  // Initialize socket connection
  useEffect(() => {
    if (!opts.auth?.token) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    const socket = io(opts.url!, {
      autoConnect: opts.autoConnect,
      reconnection: opts.reconnection,
      reconnectionAttempts: opts.reconnectionAttempts,
      reconnectionDelay: opts.reconnectionDelay,
      reconnectionDelayMax: opts.reconnectionDelayMax,
      timeout: opts.timeout,
      auth: opts.auth,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
      });
      console.log('WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: reason === 'io server disconnect' ? false : prev.reconnectAttempt > 0,
      }));
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error as Error,
      }));
      console.error('WebSocket connection error:', error);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      setState((prev) => ({
        ...prev,
        isConnecting: true,
        reconnectAttempt: attempt,
      }));
      console.log(`WebSocket reconnection attempt ${attempt}`);
    });

    socket.io.on('reconnect', () => {
      setState({
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempt: 0,
      });
      console.log('WebSocket reconnected');
    });

    socket.io.on('reconnect_failed', () => {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: new Error('Failed to reconnect after maximum attempts'),
      }));
      console.error('WebSocket reconnection failed');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [opts.url, opts.auth?.token]);

  /**
   * Subscribe to an event
   */
  const on = useCallback(<T = unknown>(event: string, callback: EventCallback<T>) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }

    const listeners = listenersRef.current.get(event)!;
    listeners.add(callback as EventCallback);

    // Register with socket
    socketRef.current?.on(event, callback as EventCallback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as EventCallback);
      socketRef.current?.off(event, callback as EventCallback);
    };
  }, []);

  /**
   * Subscribe to an event once
   */
  const once = useCallback(<T = unknown>(event: string, callback: EventCallback<T>) => {
    socketRef.current?.once(event, callback as EventCallback);
  }, []);

  /**
   * Unsubscribe from an event
   */
  const off = useCallback((event: string, callback?: EventCallback) => {
    if (callback) {
      listenersRef.current.get(event)?.delete(callback);
      socketRef.current?.off(event, callback);
    } else {
      listenersRef.current.delete(event);
      socketRef.current?.off(event);
    }
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected, cannot emit:', event);
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, []);

  /**
   * Emit with acknowledgement
   */
  const emitWithAck = useCallback(
    <T = unknown, R = unknown>(event: string, data?: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          reject(new Error('WebSocket not connected'));
          return;
        }

        socketRef.current.emit(event, data, (response: R) => {
          resolve(response);
        });
      });
    },
    []
  );

  /**
   * Join a room (project)
   */
  const joinProject = useCallback((projectId: string) => {
    emit('project:join', projectId);
  }, [emit]);

  /**
   * Leave a room (project)
   */
  const leaveProject = useCallback((projectId: string) => {
    emit('project:leave', projectId);
  }, [emit]);

  /**
   * Manually connect
   */
  const connect = useCallback(() => {
    socketRef.current?.connect();
  }, []);

  /**
   * Manually disconnect
   */
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    // State
    ...state,
    socket: socketRef.current,

    // Methods
    on,
    once,
    off,
    emit,
    emitWithAck,
    joinProject,
    leaveProject,
    connect,
    disconnect,
  };
}

/**
 * Hook for listening to specific WebSocket events
 */
export function useSocketEvent<T = unknown>(
  socket: ReturnType<typeof useWebSocket>,
  event: string,
  callback: EventCallback<T>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    if (!socket.isConnected) return;

    const unsubscribe = socket.on(event, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.isConnected, event, ...deps]);
}

/**
 * Hook for connection status indicator
 */
export function useConnectionStatus(socket: ReturnType<typeof useWebSocket>) {
  if (socket.isConnecting) {
    return 'connecting';
  }
  if (socket.isConnected) {
    return 'connected';
  }
  if (socket.error) {
    return 'error';
  }
  return 'disconnected';
}
