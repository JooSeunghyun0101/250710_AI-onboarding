'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHires, useDepartments, useStats } from '@/lib/hooks';
import { BarChart3, TrendingUp, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function StatsPage() {
  const { data: hires, isLoading: hiresLoading } = useHires();
  const { data: departments, isLoading: deptLoading } = useDepartments();
  const { data: stats, isLoading: statsLoading } = useStats();

  // 부서별 통계 계산
  const departmentStats = departments?.map(dept => {
    const deptHires = hires?.filter(hire => hire.department === dept.name) || [];
    const completed = deptHires.filter(hire => 
      hire.personal_info && Array.isArray(hire.personal_info) && hire.personal_info.length > 0
    ).length;
    
    return {
      name: dept.name,
      total: deptHires.length,
      completed,
      completionRate: deptHires.length > 0 ? Math.round((completed / deptHires.length) * 100) : 0
    };
  }) || [];

  // 최근 입사자 진행 상황
  const recentHires = hires?.slice(0, 10).map(hire => {
    const daysSinceStart = differenceInDays(new Date(), new Date(hire.start_date));
    const hasPersonalInfo = hire.personal_info && Array.isArray(hire.personal_info) && hire.personal_info.length > 0;
    
    let status = 'pending';
    let urgency = 'normal';
    
    if (hasPersonalInfo) {
      status = 'completed';
    } else if (daysSinceStart > 7) {
      status = 'overdue';
      urgency = 'high';
    } else if (daysSinceStart > 3) {
      urgency = 'medium';
    }

    return {
      ...hire,
      daysSinceStart,
      status,
      urgency
    };
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  const getUrgencyBadge = (urgency: string, status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-green-600 text-white">완료</Badge>;
    }
    
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive">긴급</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-orange-600">주의</Badge>;
      default:
        return <Badge variant="outline">대기</Badge>;
    }
  };

  if (hiresLoading || deptLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">상태 통계판</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold">상태 통계판</h1>
          <p className="text-muted">온보딩 프로세스의 전체 진행 현황을 확인하세요</p>
        </div>

        {/* 전체 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 입사자</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalHires || 0}</div>
              <p className="text-xs text-muted mt-1">등록된 총 인원</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료율</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completionRate || 0}%</div>
              <p className="text-xs text-muted mt-1">자기기입 완료율</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(stats?.totalHires || 0) - (stats?.completedSelfEntry || 0)}
              </div>
              <p className="text-xs text-muted mt-1">작업 대기 중</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이메일 발송</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.emailsSent || 0}</div>
              <p className="text-xs text-muted mt-1">성공 발송 건수</p>
            </CardContent>
          </Card>
        </div>

        {/* 부서별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              부서별 진행 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">부서별 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {departmentStats.map((dept) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{dept.name}</span>
                        <Badge variant="outline">{dept.completed}/{dept.total}명</Badge>
                      </div>
                      <span className="text-sm text-muted">{dept.completionRate}%</span>
                    </div>
                    <Progress value={dept.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 입사자 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                최근 입사자 진행 현황
              </span>
              <Badge variant="outline" className="text-xs">
                최근 10명
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentHires.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">최근 입사자가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">이름</th>
                      <th className="text-left py-3 px-4 font-medium">부서</th>
                      <th className="text-left py-3 px-4 font-medium">입사일</th>
                      <th className="text-left py-3 px-4 font-medium">경과일</th>
                      <th className="text-left py-3 px-4 font-medium">상태</th>
                      <th className="text-left py-3 px-4 font-medium">우선순위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHires.map((hire) => (
                      <tr key={hire.id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{hire.name}</td>
                        <td className="py-3 px-4">{hire.department}</td>
                        <td className="py-3 px-4">
                          {format(new Date(hire.start_date), 'yyyy-MM-dd')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={getStatusColor(hire.status)}>
                            {hire.daysSinceStart}일
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getStatusColor(hire.status)}>
                            {hire.status === 'completed' ? '완료' : 
                             hire.status === 'overdue' ? '지연' : '진행중'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getUrgencyBadge(hire.urgency, hire.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 성과 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>주간 완료 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">이번 주</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={75} className="w-20 h-2" />
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">지난 주</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={60} className="w-20 h-2" />
                    <span className="text-sm font-medium">60%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">지지난 주</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={45} className="w-20 h-2" />
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>알림 및 액션</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">지연된 입사자</p>
                    <p className="text-xs text-muted">
                      {recentHires.filter(h => h.status === 'overdue').length}명이 자기기입을 완료하지 않았습니다
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">주의 필요</p>
                    <p className="text-xs text-muted">
                      {recentHires.filter(h => h.urgency === 'medium').length}명이 곧 지연될 예정입니다
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">순조로운 진행</p>
                    <p className="text-xs text-muted">
                      {recentHires.filter(h => h.status === 'completed').length}명이 모든 단계를 완료했습니다
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 