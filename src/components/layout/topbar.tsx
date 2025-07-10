'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const handleExport = () => {
    // TODO: 데이터 내보내기 기능 구현
    alert('데이터 내보내기 기능이 곧 제공될 예정입니다.');
  };

  return (
    <header className="h-16 border-b border-border bg-background px-4 flex items-center justify-between">
      {/* 로고 */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-foreground">
          온보딩 대시보드
        </h1>
      </div>

      {/* 우측 메뉴 */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="font-bold"
        >
          <Download className="w-4 h-4 mr-2" />
          내보내기
        </Button>
      </div>
    </header>
  );
} 