/**
 * Project Detail Page
 * Phase 3: Frontend - React/Next.js
 *
 * Project view with task board and settings.
 * Should trigger: react-nextjs-expert, design-system-guardian
 */

'use client';

import { useState } from 'react';
import { TaskBoard, TaskList } from '@/components/tasks/TaskBoard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { cn } from '@/lib/utils';

// Mock data - would come from API based on [id] param
const mockProject = {
  id: '1',
  name: 'Website Redesign',
  description: 'Complete overhaul of the company website with modern design and improved UX',
  status: 'ACTIVE' as const,
  team: { id: '1', name: 'Engineering' },
  _count: { tasks: 7 },
  taskStats: { TODO: 2, IN_PROGRESS: 2, IN_REVIEW: 1, DONE: 2 },
};

const mockTasks = [
  {
    id: '1',
    title: 'Design homepage mockups',
    description: 'Create Figma mockups for the new homepage design',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    dueDate: '2024-03-10',
    assignee: { id: '2', name: 'Jane Smith', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 5 },
    createdAt: '2024-02-28T10:00:00Z',
  },
  {
    id: '2',
    title: 'Implement responsive navigation',
    description: 'Build mobile-friendly navigation component',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    dueDate: '2024-03-15',
    assignee: { id: '3', name: 'Bob Wilson', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 3 },
    createdAt: '2024-03-01T14:00:00Z',
  },
  {
    id: '3',
    title: 'Set up CMS integration',
    description: 'Connect headless CMS for content management',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    dueDate: '2024-03-20',
    assignee: null,
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 0 },
    createdAt: '2024-03-02T09:00:00Z',
  },
  {
    id: '4',
    title: 'Write API documentation',
    description: 'Document all REST endpoints for the new website',
    status: 'IN_REVIEW' as const,
    priority: 'LOW' as const,
    dueDate: '2024-03-18',
    assignee: { id: '2', name: 'Jane Smith', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 2 },
    createdAt: '2024-03-03T11:00:00Z',
  },
  {
    id: '5',
    title: 'Performance optimization',
    description: 'Optimize images, implement lazy loading, and improve Core Web Vitals',
    status: 'TODO' as const,
    priority: 'URGENT' as const,
    dueDate: '2024-03-12',
    assignee: { id: '3', name: 'Bob Wilson', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 1 },
    createdAt: '2024-03-04T16:00:00Z',
  },
  {
    id: '6',
    title: 'Implement dark mode',
    description: 'Add dark mode support with system preference detection',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    dueDate: '2024-03-22',
    assignee: { id: '2', name: 'Jane Smith', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 4 },
    createdAt: '2024-03-05T10:00:00Z',
  },
  {
    id: '7',
    title: 'Browser testing',
    description: 'Test website across all major browsers and fix compatibility issues',
    status: 'DONE' as const,
    priority: 'HIGH' as const,
    dueDate: '2024-03-08',
    assignee: { id: '3', name: 'Bob Wilson', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 6 },
    createdAt: '2024-02-25T14:00:00Z',
  },
];

const mockTeamMembers = [
  { id: '1', name: 'Admin User' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Bob Wilson' },
];

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [tasks, setTasks] = useState(mockTasks);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus as typeof task.status }
          : task
      )
    );
  };

  const handleTaskClick = (task: typeof mockTasks[0]) => {
    // Would open task detail modal
    console.log('Task clicked:', task.id);
  };

  const handleCreateTask = async (data: any) => {
    // Would call API
    console.log('Creating task:', data);
    setIsCreateModalOpen(false);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{mockProject.name}</h1>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Active
            </span>
          </div>
          <p className="mt-1 text-gray-500">{mockProject.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </Button>
        </div>
      </div>

      {/* Project stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{doneTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Progress</p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View mode toggle and task display */}
      <Card>
        <CardHeader
          title="Tasks"
          description={`${totalTasks} tasks in this project`}
          action={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('board')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    viewMode === 'board'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Board
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    viewMode === 'list'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  List
                </button>
              </div>
            </div>
          }
        />
        <CardContent>
          {viewMode === 'board' ? (
            <TaskBoard
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <TaskList tasks={tasks} onTaskClick={handleTaskClick} />
          )}
        </CardContent>
      </Card>

      {/* Create task modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
      >
        <TaskForm
          projectId={params.id}
          teamMembers={mockTeamMembers}
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
