'use client';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen flex" style={{ background: '#EDF6F9' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pl-60">
        <TopBar title={title} />
        <main
          className="flex-1 p-6"
          style={{ minHeight: 'calc(100vh - 3.5rem)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
