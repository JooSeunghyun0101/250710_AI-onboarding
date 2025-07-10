'use client';

import { Topbar } from './topbar';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* 상단바 */}
      <Topbar />
      
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 */}
        <Sidebar />
        
        {/* 페이지 컨텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="page-container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 