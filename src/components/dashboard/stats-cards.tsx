'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Mail, TrendingUp, LucideIcon } from 'lucide-react';
import type { StatsData } from '@/types';

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface StatsCardsProps {
  stats?: StatsData;
  isLoading?: boolean;
}

const StatCardSkeleton = React.memo(() => (
  <Card className="animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 bg-muted rounded w-20"></div>
      <div className="h-4 w-4 bg-muted rounded"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-muted rounded w-16 mb-2"></div>
      <div className="h-3 bg-muted rounded w-24"></div>
    </CardContent>
  </Card>
));

StatCardSkeleton.displayName = 'StatCardSkeleton';

const StatCardComponent = React.memo(({ card }: { card: StatCard }) => {
  const Icon = card.icon;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {card.title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${card.color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{card.value}</div>
        <p className="text-xs text-muted mt-1">
          {card.description}
        </p>
      </CardContent>
    </Card>
  );
});

StatCardComponent.displayName = 'StatCardComponent';

export const StatsCards = React.memo(({ stats, isLoading }: StatsCardsProps) => {
  const statCards: StatCard[] = React.useMemo(() => [
    {
      title: '전체 입사자',
      value: stats?.totalHires || 0,
      description: '등록된 총 입사자 수',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: '자기기입 완료',
      value: stats?.completedSelfEntry || 0,
      description: '정보 입력을 완료한 수',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: '이메일 발송',
      value: stats?.emailsSent || 0,
      description: '성공적으로 발송된 메일',
      icon: Mail,
      color: 'text-blue-600'
    },
    {
      title: '완료율',
      value: `${stats?.completionRate || 0}%`,
      description: '전체 진행 완료율',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ], [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((card) => (
        <StatCardComponent key={card.title} card={card} />
      ))}
    </div>
  );
});

StatsCards.displayName = 'StatsCards'; 