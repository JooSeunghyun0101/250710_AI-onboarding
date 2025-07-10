'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  UserPlus, 
  Users, 
  FileText, 
  Download
} from 'lucide-react';

const menuItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: '대시보드',
    description: '현황 및 통계 보기'
  },
  {
    href: '/dashboard/register',
    icon: UserPlus,
    label: '신규입사자 등록',
    description: '새 입사자 정보 입력'
  },
  {
    href: '/dashboard/list',
    icon: Users,
    label: '입사자 목록',
    description: '전체 입사자 관리'
  },
  {
    href: '/dashboard/self-entry',
    icon: FileText,
    label: '자기기입 관리',
    description: '입사자 자기기입 현황'
  },
  {
    href: '/dashboard/export',
    icon: Download,
    label: '데이터 내보내기',
    description: '데이터 다운로드'
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background border-r border-border h-full">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-md font-medium',
                'hover:bg-primary/10 hover:text-primary',
                isActive 
                  ? 'bg-primary text-primary-foreground font-bold' 
                  : 'text-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{item.label}</div>
                <div className={cn(
                  'text-xs truncate',
                  isActive ? 'text-primary-foreground/70' : 'text-muted/70'
                )}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
} 