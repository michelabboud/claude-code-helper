/**
 * Root Layout
 * Phase 3: Frontend - React/Next.js
 *
 * Application root layout with providers.
 * Should trigger: react-nextjs-expert
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Task Manager Pro',
  description: 'Professional task and project management for teams',
  keywords: ['task management', 'project management', 'team collaboration'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
