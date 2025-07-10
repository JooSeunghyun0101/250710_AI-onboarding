'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OnboardingProgress } from '@/components/dashboard/onboarding-progress';
import { useStats, useHires, useRecentActivities } from '@/lib/hooks';
import { Calendar, CheckCircle, Clock, AlertTriangle, User, FileText, Mail, UserPlus, MailX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: hires, isLoading: hiresLoading } = useHires();
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities(8);

  // 활동 타입별 아이콘과 색상 매핑
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_hire':
        return { icon: UserPlus, color: 'text-blue-600' };
      case 'personal_info':
        return { icon: FileText, color: 'text-green-600' };
      case 'email_sent':
        return { icon: Mail, color: 'text-emerald-600' };
      case 'email_failed':
        return { icon: MailX, color: 'text-red-600' };
      default:
        return { icon: Clock, color: 'text-gray-600' };
    }
  };

  const isLoading = statsLoading || hiresLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 인사말 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">안녕하세요, 인사담당자님 👋</h1>
            <p className="text-muted">오늘도 효율적인 온보딩 관리를 시작하세요.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted" />
            <span className="text-sm text-muted">
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* 통계 카드 */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* 메인 콘텐츠 영역 - 1:1 비율로 변경 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 온보딩 진행 현황 */}
          <div>
            <OnboardingProgress hires={hires} isLoading={hiresLoading} />
          </div>

          {/* 최근 활동 - 실제 데이터로 변경 */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    최근 활동
                  </CardTitle>
                  <Link 
                    href="/dashboard/list" 
                    className="text-sm text-primary hover:underline"
                  >
                    전체 보기
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex items-start space-x-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted/40 flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-4 bg-muted/40 rounded w-3/4" />
                          <div className="h-3 bg-muted/40 rounded w-full" />
                          <div className="h-3 bg-muted/40 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities && recentActivities.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivities.map((activity) => {
                      const { icon: Icon, color } = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 group">
                          <div className={`w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center flex-shrink-0 group-hover:bg-muted/30 transition-colors`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors cursor-pointer">
                              <Link href={`/dashboard/list/${activity.hire_id}`}>
                                {activity.title}
                              </Link>
                            </p>
                            <p className="text-xs text-muted mt-1 line-clamp-2">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted/70 mt-1">
                              {formatDistanceToNow(new Date(activity.time), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="w-12 h-12 text-muted/40 mb-4" />
                    <p className="text-sm text-muted">최근 활동이 없습니다.</p>
                    <p className="text-xs text-muted/70 mt-1">
                      새로운 입사자가 등록되거나 활동이 있을 때 여기에 표시됩니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 