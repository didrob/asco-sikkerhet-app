import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0B0F19]">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
