/**
 * TaskCard Component
 * Phase 3: Frontend - React/Next.js
 *
 * Task display card with status badge and actions.
 * Should trigger: react-nextjs-expert, design-system-guardian
 */

'use client';

import { formatDate, formatRelativeTime, cn, getInitials } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface User {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignee?: User | null;
  creator: User;
  _count?: { comments: number };
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showProject?: boolean;
  projectName?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'To Do', className: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'In Review', className: 'bg-purple-100 text-purple-700' },
  BLOCKED: { label: 'Blocked', className: 'bg-red-100 text-red-700' },
  DONE: { label: 'Done', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string; icon: string }> = {
  LOW: { label: 'Low', className: 'text-gray-400', icon: '↓' },
  MEDIUM: { label: 'Medium', className: 'text-yellow-500', icon: '→' },
  HIGH: { label: 'High', className: 'text-orange-500', icon: '↑' },
  URGENT: { label: 'Urgent', className: 'text-red-500', icon: '⚡' },
};

export function TaskCard({ task, onClick, showProject, projectName }: TaskCardProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <Card
      variant="interactive"
      padding="sm"
      className="group"
      onClick={onClick}
    >
      {/* Header with priority and status */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', priority.className)} title={priority.label}>
            {priority.icon}
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
            {status.label}
          </span>
        </div>
        {showProject && projectName && (
          <span className="text-xs text-gray-500">{projectName}</span>
        )}
      </div>

      {/* Title */}
      <h4 className="mb-1 font-medium text-gray-900 group-hover:text-blue-600">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-500">
          {task.description}
        </p>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-1" title={`Assigned to ${task.assignee.name}`}>
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                  {getInitials(task.assignee.name)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-300">Unassigned</span>
          )}

          {/* Comments count */}
          {task._count && task._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </Card>
  );
}

// Status badge component for use elsewhere
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

// Priority indicator component
export function TaskPriorityIndicator({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority];
  return (
    <span className={cn('text-sm font-medium', config.className)} title={config.label}>
      {config.icon}
    </span>
  );
}
