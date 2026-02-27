import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, activeView, onViewChange }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
