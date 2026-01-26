/**
 * TaskCard Component Tests
 * Phase 7: Testing
 *
 * Tests for TaskCard rendering and interactions.
 * Should trigger: qa-testing-expert, react-nextjs-expert
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard, TaskStatusBadge, TaskPriorityIndicator } from '@/components/tasks/TaskCard';

// Mock task data
const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'TODO' as const,
  priority: 'HIGH' as const,
  dueDate: '2024-12-31',
  assignee: {
    id: 'user-1',
    name: 'John Doe',
    avatarUrl: null,
  },
  creator: {
    id: 'user-2',
    name: 'Jane Smith',
    avatarUrl: null,
  },
  _count: {
    comments: 3,
  },
  createdAt: '2024-01-01T00:00:00Z',
};

describe('TaskCard', () => {
  describe('Rendering', () => {
    it('should render task title', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should render task description', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText(/This is a test task description/)).toBeInTheDocument();
    });

    it('should render status badge', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    it('should render priority indicator', () => {
      render(<TaskCard task={mockTask} />);

      // High priority uses ↑ icon
      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('should render assignee initials when no avatar', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render comment count', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render due date', () => {
      render(<TaskCard task={mockTask} />);

      // The date format depends on the formatDate function
      expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
    });
  });

  describe('Without Optional Data', () => {
    it('should render without description', () => {
      const taskWithoutDesc = { ...mockTask, description: null };
      render(<TaskCard task={taskWithoutDesc} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText(/test task description/)).not.toBeInTheDocument();
    });

    it('should render "Unassigned" when no assignee', () => {
      const unassignedTask = { ...mockTask, assignee: null };
      render(<TaskCard task={unassignedTask} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should not render comment count when zero', () => {
      const taskNoComments = { ...mockTask, _count: { comments: 0 } };
      render(<TaskCard task={taskNoComments} />);

      // Should not find the comments section
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should not render due date when null', () => {
      const taskNoDueDate = { ...mockTask, dueDate: null };
      render(<TaskCard task={taskNoDueDate} />);

      expect(screen.queryByText(/Dec/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<TaskCard task={mockTask} onClick={handleClick} />);

      const card = screen.getByText('Test Task').closest('[class*="group"]');
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', () => {
      expect(() => {
        render(<TaskCard task={mockTask} />);
        const card = screen.getByText('Test Task').closest('[class*="group"]');
        fireEvent.click(card!);
      }).not.toThrow();
    });
  });

  describe('Overdue State', () => {
    it('should show overdue styling for past due date', () => {
      const overdueTask = {
        ...mockTask,
        dueDate: '2020-01-01',
        status: 'IN_PROGRESS' as const,
      };
      render(<TaskCard task={overdueTask} />);

      // The overdue text should have red color class
      const dueDateElement = screen.getByText(/Jan 1, 2020/);
      expect(dueDateElement.closest('span')).toHaveClass('text-red-500');
    });

    it('should not show overdue styling for done tasks', () => {
      const doneOverdueTask = {
        ...mockTask,
        dueDate: '2020-01-01',
        status: 'DONE' as const,
      };
      render(<TaskCard task={doneOverdueTask} />);

      const dueDateElement = screen.getByText(/Jan 1, 2020/);
      expect(dueDateElement.closest('span')).not.toHaveClass('text-red-500');
    });
  });

  describe('Project Name Display', () => {
    it('should show project name when showProject is true', () => {
      render(<TaskCard task={mockTask} showProject projectName="Test Project" />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should not show project name when showProject is false', () => {
      render(<TaskCard task={mockTask} showProject={false} projectName="Test Project" />);

      expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
    });
  });
});

describe('TaskStatusBadge', () => {
  const statuses = [
    { status: 'TODO' as const, label: 'To Do', className: 'bg-gray-100' },
    { status: 'IN_PROGRESS' as const, label: 'In Progress', className: 'bg-blue-100' },
    { status: 'IN_REVIEW' as const, label: 'In Review', className: 'bg-purple-100' },
    { status: 'BLOCKED' as const, label: 'Blocked', className: 'bg-red-100' },
    { status: 'DONE' as const, label: 'Done', className: 'bg-green-100' },
    { status: 'CANCELLED' as const, label: 'Cancelled', className: 'bg-gray-100' },
  ];

  statuses.forEach(({ status, label, className }) => {
    it(`should render ${status} status correctly`, () => {
      render(<TaskStatusBadge status={status} />);

      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(className);
    });
  });
});

describe('TaskPriorityIndicator', () => {
  const priorities = [
    { priority: 'LOW' as const, icon: '↓', className: 'text-gray-400' },
    { priority: 'MEDIUM' as const, icon: '→', className: 'text-yellow-500' },
    { priority: 'HIGH' as const, icon: '↑', className: 'text-orange-500' },
    { priority: 'URGENT' as const, icon: '⚡', className: 'text-red-500' },
  ];

  priorities.forEach(({ priority, icon, className }) => {
    it(`should render ${priority} priority correctly`, () => {
      render(<TaskPriorityIndicator priority={priority} />);

      const indicator = screen.getByText(icon);
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass(className);
    });
  });
});

describe('Accessibility', () => {
  it('should have accessible card structure', () => {
    render(<TaskCard task={mockTask} />);

    // Title should be prominent
    const title = screen.getByText('Test Task');
    expect(title.tagName).toBe('H4');
  });

  it('should have title attribute on priority indicator', () => {
    render(<TaskCard task={mockTask} />);

    const priorityIndicator = screen.getByTitle('High');
    expect(priorityIndicator).toBeInTheDocument();
  });

  it('should have title attribute on assignee', () => {
    render(<TaskCard task={mockTask} />);

    const assigneeElement = screen.getByTitle('Assigned to John Doe');
    expect(assigneeElement).toBeInTheDocument();
  });
});
