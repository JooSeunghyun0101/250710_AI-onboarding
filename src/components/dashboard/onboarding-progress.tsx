'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, User } from 'lucide-react';
import { format } from 'date-fns';
import type { Hire } from '@/lib/api';
import type { HireStatus } from '@/types';

// personal_info가 포함된 Hire 타입 확장
interface HireWithPersonalInfo extends Hire {
  personal_info?: Array<{
    id: string;
    hire_id: string;
    insurance_dependents?: unknown;
    health_hospital?: string;
    health_date?: string;
    survey_good?: string;
    survey_pain?: string;
  }>;
}

interface HireWithProgress extends HireWithPersonalInfo {
  daysSinceStart: number;
  status: HireStatus;
  progress: number;
  statusText: string;
  statusColor: string;
}

interface OnboardingProgressProps {
  hires?: HireWithPersonalInfo[];
  isLoading?: boolean;
}

const ProgressItemSkeleton = React.memo(() => (
  <div className="flex items-center space-x-4 p-3 rounded-lg border animate-pulse">
    <div className="w-10 h-10 rounded-full bg-muted"></div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-3 bg-muted rounded w-24"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-muted rounded w-12"></div>
          <div className="h-3 bg-muted rounded w-8"></div>
        </div>
      </div>
      <div className="h-2 bg-muted rounded w-full"></div>
    </div>
  </div>
));

ProgressItemSkeleton.displayName = 'ProgressItemSkeleton';

const ProgressItem = React.memo(({ hire }: { hire: HireWithProgress }) => (
  <div className="flex items-center space-x-4 p-3 rounded-lg border">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <User className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{hire.name}</span>
          <Badge variant="outline" className="text-xs">
            {hire.department}
          </Badge>
          <span className="text-xs text-muted">
            입사일: {format(new Date(hire.start_date), 'yyyy-MM-dd')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${hire.statusColor}`}>
            {hire.statusText}
          </span>
          <span className="text-xs text-muted">
            {hire.progress}%
          </span>
        </div>
      </div>
      <Progress value={hire.progress} className="h-2" />
    </div>
  </div>
));

ProgressItem.displayName = 'ProgressItem';

export const OnboardingProgress = React.memo(({ hires, isLoading }: OnboardingProgressProps) => {
  const hiresWithProgress = React.useMemo(() => {
    if (!hires) return [];
    
    return hires.slice(0, 5).map(hire => {
      const daysSinceStart = Math.floor(
        (new Date().getTime() - new Date(hire.start_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
             const hasPersonalInfo = (hire as any).personal_info && 
         Array.isArray((hire as any).personal_info) && 
         (hire as any).personal_info.length > 0;
      
      let status: HireStatus = 'pending';
      let progress = 0;
      let statusText = '대기';
      let statusColor = 'text-orange-600';
      
      if (hasPersonalInfo) {
        status = 'completed';
        progress = 100;
        statusText = '완료';
        statusColor = 'text-green-600';
      } else if (daysSinceStart > 7) {
        status = 'overdue';
        progress = 20;
        statusText = '지연';
        statusColor = 'text-red-600';
      } else if (daysSinceStart > 3) {
        status = 'in_progress';
        progress = 60;
        statusText = '진행중';
        statusColor = 'text-blue-600';
      } else {
        status = 'in_progress';
        progress = 30;
        statusText = '진행중';
        statusColor = 'text-blue-600';
      }

      return {
        ...hire,
        daysSinceStart,
        status,
        progress,
        statusText,
        statusColor
      } as HireWithProgress;
    });
  }, [hires]);

  const statusCounts = React.useMemo(() => {
    const total = hires?.length || 0;
    const inProgress = hiresWithProgress.filter(h => h.status !== 'completed').length;
    const pending = hiresWithProgress.filter(h => h.status === 'pending').length;
    
    return { total, inProgress, pending };
  }, [hires, hiresWithProgress]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            온보딩 진행 현황
          </CardTitle>
          <div className="flex space-x-2">
            <Badge variant="outline">전체 {statusCounts.total}</Badge>
            <Badge variant="outline">진행중 {statusCounts.inProgress}</Badge>
            <Badge variant="outline">대기중 {statusCounts.pending}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }, (_, i) => <ProgressItemSkeleton key={i} />)
          ) : hiresWithProgress.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">등록된 입사자가 없습니다.</p>
            </div>
          ) : (
            hiresWithProgress.map((hire) => (
              <ProgressItem key={hire.id} hire={hire} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OnboardingProgress.displayName = 'OnboardingProgress'; 