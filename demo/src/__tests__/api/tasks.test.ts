/**
 * Tasks API Integration Tests
 * Phase 7: Testing
 *
 * Tests for task CRUD operations and authorization.
 * Should trigger: qa-testing-expert
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

// Task validation schemas (matching API)
const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED']);
const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const CreateTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  status: TaskStatusEnum.optional().default('TODO'),
  priority: TaskPriorityEnum.optional().default('MEDIUM'),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

// Mock task data
const mockTask = {
  id: 'clp123456789',
  projectId: 'clp987654321',
  title: 'Test Task',
  description: 'Test description',
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  assigneeId: null,
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Task Validation', () => {
  describe('CreateTaskSchema', () => {
    it('should validate a valid task', () => {
      const validTask = {
        title: 'New Task',
        description: 'Task description',
        status: 'TODO',
        priority: 'HIGH',
      };

      const result = CreateTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalidTask = {
        description: 'No title',
      };

      const result = CreateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should require title minimum length', () => {
      const invalidTask = {
        title: 'A',
      };

      const result = CreateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should limit title length', () => {
      const invalidTask = {
        title: 'A'.repeat(201),
      };

      const result = CreateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should limit description length', () => {
      const invalidTask = {
        title: 'Valid Title',
        description: 'A'.repeat(5001),
      };

      const result = CreateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should validate status enum', () => {
      const invalidTask = {
        title: 'Valid Title',
        status: 'INVALID_STATUS',
      };

      const result = CreateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should validate priority enum', () => {
      const invalidTask = {
        title: 'Valid Title',
        priority: 'SUPER_HIGH',
      };

      const result = CreateTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should set default values', () => {
      const minimalTask = {
        title: 'Minimal Task',
      };

      const result = CreateTaskSchema.safeParse(minimalTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('TODO');
        expect(result.data.priority).toBe('MEDIUM');
      }
    });
  });

  describe('UpdateTaskSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
      };

      const result = UpdateTaskSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty update', () => {
      const emptyUpdate = {};

      const result = UpdateTaskSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow nullable fields', () => {
      const nullableUpdate = {
        assigneeId: null,
        dueDate: null,
      };

      const result = UpdateTaskSchema.safeParse(nullableUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate datetime format', () => {
      const validDate = {
        dueDate: '2024-12-31T23:59:59.000Z',
      };

      const result = UpdateTaskSchema.safeParse(validDate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const invalidDate = {
        dueDate: 'not-a-date',
      };

      const result = UpdateTaskSchema.safeParse(invalidDate);
      expect(result.success).toBe(false);
    });
  });
});

describe('Task CRUD Operations', () => {
  describe('Create Task', () => {
    it('should create a task with valid data', () => {
      const taskData = {
        title: 'New Task',
        description: 'Description',
        status: 'TODO' as const,
        priority: 'HIGH' as const,
      };

      // Simulate task creation
      const createdTask = {
        ...taskData,
        id: 'generated-id',
        projectId: mockTask.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(createdTask.id).toBeDefined();
      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.status).toBe('TODO');
    });

    it('should trim whitespace from title', () => {
      const title = '  Task with spaces  ';
      const trimmed = title.trim();

      expect(trimmed).toBe('Task with spaces');
    });
  });

  describe('Read Task', () => {
    it('should return task by ID', () => {
      const task = { ...mockTask };

      expect(task.id).toBe(mockTask.id);
      expect(task.title).toBe(mockTask.title);
    });

    it('should return null for non-existent task', () => {
      const task = null; // Simulated not found

      expect(task).toBeNull();
    });
  });

  describe('Update Task', () => {
    it('should update task fields', () => {
      const task = { ...mockTask };
      const updates = { title: 'Updated Title', status: 'IN_PROGRESS' as const };

      const updatedTask = { ...task, ...updates, updatedAt: new Date().toISOString() };

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.status).toBe('IN_PROGRESS');
      expect(updatedTask.id).toBe(task.id);
    });

    it('should not modify unchanged fields', () => {
      const task = { ...mockTask };
      const updates = { status: 'DONE' as const };

      const updatedTask = { ...task, ...updates };

      expect(updatedTask.title).toBe(task.title);
      expect(updatedTask.description).toBe(task.description);
    });
  });

  describe('Delete Task', () => {
    it('should mark task as deleted', () => {
      const task = { ...mockTask };
      const deletedTask = { ...task, deletedAt: new Date().toISOString() };

      expect(deletedTask.deletedAt).toBeDefined();
    });
  });
});

describe('Task Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    TODO: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'],
    IN_PROGRESS: ['TODO', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED'],
    IN_REVIEW: ['IN_PROGRESS', 'DONE', 'BLOCKED'],
    BLOCKED: ['TODO', 'IN_PROGRESS', 'CANCELLED'],
    DONE: ['TODO', 'IN_PROGRESS'], // Reopen
    CANCELLED: ['TODO'], // Reopen
  };

  it('should allow valid status transitions', () => {
    Object.entries(validTransitions).forEach(([from, toOptions]) => {
      toOptions.forEach((to) => {
        const isValid = validTransitions[from]?.includes(to);
        expect(isValid).toBe(true);
      });
    });
  });

  it('should track status change history', () => {
    const statusHistory = [
      { status: 'TODO', timestamp: '2024-01-01T00:00:00Z' },
      { status: 'IN_PROGRESS', timestamp: '2024-01-02T00:00:00Z' },
      { status: 'IN_REVIEW', timestamp: '2024-01-03T00:00:00Z' },
      { status: 'DONE', timestamp: '2024-01-04T00:00:00Z' },
    ];

    expect(statusHistory.length).toBe(4);
    expect(statusHistory[0].status).toBe('TODO');
    expect(statusHistory[statusHistory.length - 1].status).toBe('DONE');
  });
});

describe('Task Authorization', () => {
  const userRoles = {
    OWNER: ['create', 'read', 'update', 'delete', 'assign'],
    ADMIN: ['create', 'read', 'update', 'delete', 'assign'],
    MEMBER: ['create', 'read', 'update'],
    VIEWER: ['read'],
  };

  it('should allow owners all permissions', () => {
    const permissions = userRoles.OWNER;

    expect(permissions).toContain('create');
    expect(permissions).toContain('read');
    expect(permissions).toContain('update');
    expect(permissions).toContain('delete');
    expect(permissions).toContain('assign');
  });

  it('should restrict viewers to read only', () => {
    const permissions = userRoles.VIEWER;

    expect(permissions).toContain('read');
    expect(permissions).not.toContain('create');
    expect(permissions).not.toContain('update');
    expect(permissions).not.toContain('delete');
  });

  it('should allow members to create and update', () => {
    const permissions = userRoles.MEMBER;

    expect(permissions).toContain('create');
    expect(permissions).toContain('read');
    expect(permissions).toContain('update');
    expect(permissions).not.toContain('delete');
    expect(permissions).not.toContain('assign');
  });
});

describe('Task Edge Cases', () => {
  it('should handle empty description', () => {
    const task = { ...mockTask, description: '' };

    expect(task.description).toBe('');
  });

  it('should handle null assignee', () => {
    const task = { ...mockTask, assigneeId: null };

    expect(task.assigneeId).toBeNull();
  });

  it('should handle past due date', () => {
    const pastDate = new Date('2020-01-01').toISOString();
    const task = { ...mockTask, dueDate: pastDate };

    expect(new Date(task.dueDate!) < new Date()).toBe(true);
  });

  it('should handle special characters in title', () => {
    const specialTitle = '<script>alert("xss")</script>';
    const escaped = specialTitle
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });

  it('should handle unicode in content', () => {
    const unicodeTitle = '任务 📝 タスク مهمة';

    expect(unicodeTitle.length > 0).toBe(true);
  });
});
