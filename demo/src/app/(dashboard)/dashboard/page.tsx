/**
 * Dashboard Page
 * Phase 3: Frontend - React/Next.js
 *
 * Main dashboard with overview stats and recent activity.
 * Should trigger: react-nextjs-expert, design-system-guardian
 */

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { TaskCard } from '@/components/tasks/TaskCard';

// Mock data - would come from API
const stats = [
  { label: 'Total Tasks', value: '47', change: '+12%', color: 'text-blue-600' },
  { label: 'In Progress', value: '12', change: '+3', color: 'text-yellow-600' },
  { label: 'Completed', value: '28', change: '+8', color: 'text-green-600' },
  { label: 'Overdue', value: '3', change: '-2', color: 'text-red-600' },
];

const recentTasks = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication with login and registration flows',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    dueDate: '2024-03-15',
    assignee: { id: '2', name: 'Jane Smith', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 3 },
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Design system components',
    description: 'Create reusable UI components with Tailwind CSS',
    status: 'IN_REVIEW' as const,
    priority: 'MEDIUM' as const,
    dueDate: '2024-03-12',
    assignee: { id: '3', name: 'Bob Wilson', avatarUrl: null },
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 5 },
    createdAt: '2024-03-02T14:00:00Z',
  },
  {
    id: '3',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'TODO' as const,
    priority: 'URGENT' as const,
    dueDate: '2024-03-10',
    assignee: null,
    creator: { id: '1', name: 'Admin User', avatarUrl: null },
    _count: { comments: 0 },
    createdAt: '2024-03-03T09:00:00Z',
  },
];

const recentActivity = [
  { id: '1', user: 'Jane Smith', action: 'completed task', target: 'Setup database schema', time: '2 hours ago' },
  { id: '2', user: 'Bob Wilson', action: 'commented on', target: 'Design system components', time: '3 hours ago' },
  { id: '3', user: 'Admin User', action: 'created task', target: 'Implement user authentication', time: '5 hours ago' },
  { id: '4', user: 'Jane Smith', action: 'moved task to In Progress', target: 'API endpoints', time: '1 day ago' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        <Link
          href="/projects"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          View all projects
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <span className="text-sm text-gray-500">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Tasks"
              description="Your most recent task updates"
              action={
                <Link
                  href="/tasks?assignedToMe=true"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              }
            />
            <CardContent className="space-y-3">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity feed */}
        <div>
          <Card className="h-full">
            <CardHeader title="Recent Activity" description="What your team has been up to" />
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {activity.user.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1 text-sm">
                      <p>
                        <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                        <span className="text-gray-500">{activity.action}</span>{' '}
                        <span className="font-medium text-gray-900">{activity.target}</span>
                      </p>
                      <p className="text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader title="Quick Actions" description="Common tasks to get you started" />
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Link>
            <Link
              href="/teams/invite"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite Team Member
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
