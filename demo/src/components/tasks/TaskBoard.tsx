/**
 * TaskBoard Component
 * Phase 3: Frontend - React/Next.js
 *
 * Kanban board for task management with drag-drop support.
 * Should trigger: react-nextjs-expert, design-system-guardian
 */

'use client';

import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';

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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  assignee?: User | null;
  creator: User;
  _count?: { comments: number };
  createdAt: string;
}

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  columns?: TaskStatus[];
}

const defaultColumns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const columnConfig: Record<TaskStatus, { title: string; color: string }> = {
  TODO: { title: 'To Do', color: 'bg-gray-400' },
  IN_PROGRESS: { title: 'In Progress', color: 'bg-blue-500' },
  IN_REVIEW: { title: 'In Review', color: 'bg-purple-500' },
  BLOCKED: { title: 'Blocked', color: 'bg-red-500' },
  DONE: { title: 'Done', color: 'bg-green-500' },
  CANCELLED: { title: 'Cancelled', color: 'bg-gray-300' },
};

export function TaskBoard({
  tasks,
  onTaskClick,
  onStatusChange,
  columns = defaultColumns,
}: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== newStatus && onStatusChange) {
      onStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((status) => {
        const columnTasks = getTasksByStatus(status);
        const config = columnConfig[status];
        const isDragOver = dragOverColumn === status;

        return (
          <div
            key={status}
            className="flex w-72 flex-shrink-0 flex-col"
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full', config.color)} />
                <h3 className="font-medium text-gray-900">{config.title}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column content */}
            <div
              className={cn(
                'flex-1 space-y-3 rounded-lg p-2 transition-colors',
                isDragOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : 'bg-gray-50'
              )}
            >
              {columnTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'cursor-grab active:cursor-grabbing',
                      draggedTask?.id === task.id && 'opacity-50'
                    )}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick?.(task)} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List view alternative
export function TaskList({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-500">
        No tasks found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
      ))}
    </div>
  );
}
