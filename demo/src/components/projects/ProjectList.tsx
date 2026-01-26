/**
 * ProjectList Component
 * Phase 3: Frontend - React/Next.js
 *
 * Grid/list view for projects with status and progress.
 * Should trigger: react-nextjs-expert, design-system-guardian
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, capitalize } from '@/lib/utils';

type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'ON_HOLD' | 'COMPLETED';

interface TaskStats {
  TODO?: number;
  IN_PROGRESS?: number;
  IN_REVIEW?: number;
  BLOCKED?: number;
  DONE?: number;
  CANCELLED?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  team: {
    id: string;
    name: string;
  };
  _count: {
    tasks: number;
  };
  taskStats?: TaskStats;
}

interface ProjectListProps {
  projects: Project[];
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
  ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-600' },
  ON_HOLD: { label: 'On Hold', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
};

function ProjectCard({ project }: { project: Project }) {
  const status = statusConfig[project.status];
  const totalTasks = project._count.tasks;
  const doneTasks = project.taskStats?.DONE || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card variant="interactive" className="h-full">
        <CardHeader
          title={project.name}
          description={project.team.name}
          action={
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
              {status.label}
            </span>
          }
        />
        <CardContent>
          {project.description && (
            <p className="mb-4 line-clamp-2 text-sm text-gray-500">{project.description}</p>
          )}

          {/* Progress bar */}
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Task stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{totalTasks} tasks</span>
            <span>{doneTasks} completed</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const status = statusConfig[project.status];
  const totalTasks = project._count.tasks;
  const doneTasks = project.taskStats?.DONE || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-500 hover:shadow-sm">
        {/* Project info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium shrink-0', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{project.team.name}</p>
        </div>

        {/* Progress */}
        <div className="w-32 shrink-0">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task count */}
        <div className="w-20 shrink-0 text-right">
          <p className="text-sm font-medium text-gray-900">{totalTasks}</p>
          <p className="text-xs text-gray-500">tasks</p>
        </div>
      </div>
    </Link>
  );
}

export function ProjectList({ projects, viewMode = 'grid', onViewModeChange }: ProjectListProps) {
  const [mode, setMode] = useState(viewMode);

  const handleModeChange = (newMode: 'grid' | 'list') => {
    setMode(newMode);
    onViewModeChange?.(newMode);
  };

  if (projects.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-500">
        No projects found
      </div>
    );
  }

  return (
    <div>
      {/* View mode toggle */}
      <div className="mb-4 flex justify-end">
        <div className="flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => handleModeChange('grid')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => handleModeChange('list')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Project display */}
      {mode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
