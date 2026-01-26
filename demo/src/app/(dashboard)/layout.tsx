/**
 * Dashboard Layout
 * Phase 3: Frontend - React/Next.js
 *
 * Authenticated dashboard layout with sidebar and header.
 * Should trigger: react-nextjs-expert
 */

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

// Mock data - would come from API in real app
const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@taskpro.com',
  avatarUrl: null,
};

const mockTeams = [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Marketing' },
];

const mockProjects = [
  { id: '1', name: 'Website Redesign', teamId: '1' },
  { id: '2', name: 'API Development', teamId: '1' },
  { id: '3', name: 'Brand Campaign', teamId: '2' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar teams={mockTeams} projects={mockProjects} currentTeamId="1" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={mockUser} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
