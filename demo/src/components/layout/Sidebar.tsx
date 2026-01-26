/**
 * Sidebar Component
 * Phase 3: Frontend - React/Next.js
 *
 * Navigation sidebar with team/project navigation.
 * Should trigger: react-nextjs-expert
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  teamId: string;
}

interface SidebarProps {
  teams?: Team[];
  projects?: Project[];
  currentTeamId?: string;
}

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'My Tasks',
    href: '/tasks?assignedToMe=true',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar({ teams = [], projects = [], currentTeamId }: SidebarProps) {
  const pathname = usePathname();
  const [expandedTeams, setExpandedTeams] = useState<string[]>(currentTeamId ? [currentTeamId] : []);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const teamProjects = (teamId: string) => projects.filter((p) => p.teamId === teamId);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0]);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span className={cn(isActive ? 'text-blue-600' : 'text-gray-400')}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Teams & Projects */}
      {teams.length > 0 && (
        <div className="border-t border-gray-200 px-3 py-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Teams & Projects
          </h3>
          <div className="space-y-1">
            {teams.map((team) => (
              <div key={team.id}>
                <button
                  onClick={() => toggleTeam(team.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <span className="truncate">{team.name}</span>
                  <svg
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform',
                      expandedTeams.includes(team.id) && 'rotate-90'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedTeams.includes(team.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {teamProjects(team.id).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className={cn(
                          'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                          pathname === `/projects/${project.id}`
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        {project.name}
                      </Link>
                    ))}
                    {teamProjects(team.id).length === 0 && (
                      <p className="px-3 py-1.5 text-sm text-gray-400">No projects</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
