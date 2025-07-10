'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHires } from '@/lib/hooks';
import { calculateSelfEntryProgress } from '@/lib/utils';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SelfEntryPage() {
  const { data: hires, isLoading } = useHires();

  const getCompletionStatus = (hire: any) => {
    // personal_info는 1:1 관계이므로 배열이지만 실제로는 첫 번째 요소만 사용
    const personalInfo = hire.personal_info?.[0] || hire.personal_info;
    return calculateSelfEntryProgress(personalInfo);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string, percentage: number) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-white">완료</Badge>;
      case 'partial':
        return <Badge variant="outline" className="text-orange-600">진행 중 ({percentage}%)</Badge>;
      default:
        return <Badge variant="outline" className="text-red-600">미시작</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">자기기입 관리</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-full"></div>
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
          <h1 className="text-2xl font-bold">자기기입 관리</h1>
          <p className="text-muted">입사자들의 자기기입 현황을 확인하고 관리하세요</p>
        </div>

        {/* 전체 현황 요약 */}
        {hires && hires.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted mb-2">전체 입사자</h3>
                <div className="text-2xl font-bold">{hires.length}명</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted mb-2">완료</h3>
                <div className="text-2xl font-bold text-green-600">
                  {hires.filter(hire => getCompletionStatus(hire).status === 'completed').length}명
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted mb-2">진행 중</h3>
                <div className="text-2xl font-bold text-orange-600">
                  {hires.filter(hire => getCompletionStatus(hire).status === 'partial').length}명
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-muted mb-2">미시작</h3>
                <div className="text-2xl font-bold text-red-600">
                  {hires.filter(hire => getCompletionStatus(hire).status === 'pending').length}명
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 입사자별 자기기입 현황 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">입사자별 현황</h2>
          
          {!hires || hires.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">등록된 입사자가 없습니다</h3>
                <p className="text-muted mb-4">먼저 신규 입사자를 등록해주세요.</p>
                <Link href="/dashboard/register">
                  <Button>신규 입사자 등록</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hires.map((hire) => {
                const status = getCompletionStatus(hire);
                
                return (
                  <Card key={hire.id} className="hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{hire.name}</CardTitle>
                        {getStatusIcon(status.status)}
                      </div>
                      <div className="text-sm text-muted">
                        {hire.department} • {format(new Date(hire.start_date), 'yyyy-MM-dd')}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* 진행률 */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">진행률</span>
                          <span className="text-sm text-muted">{status.percentage}%</span>
                        </div>
                        <Progress value={status.percentage} className="h-2" />
                      </div>

                      {/* 상태 및 액션 */}
                      <div className="flex items-center justify-between pt-2">
                        {getStatusBadge(status.status, status.percentage)}
                        <Link href={`/dashboard/self-entry/${hire.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            {status.status === 'pending' ? '시작하기' : '수정하기'}
                          </Button>
                        </Link>
                      </div>

                      {/* 세부 항목 체크리스트 */}
                      {status.status !== 'pending' && (
                        <div className="text-xs text-muted border-t pt-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span>보험 정보</span>
                              {status.stepCompletion.step1 ? '✓' : '○'}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>건강검진</span>
                              {status.stepCompletion.step2 ? '✓' : '○'}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>설문 응답</span>
                              {status.stepCompletion.step3 ? '✓' : '○'}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 도움말 */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-medium mb-2">자기기입 항목 안내</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-600 mb-1">보험 정보</h4>
                <p className="text-muted">직계가족의 이름, 주민번호, 관계 정보를 입력합니다.</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-1">건강검진</h4>
                <p className="text-muted">채용검진을 받을 병원과 희망 날짜를 선택합니다.</p>
              </div>
              <div>
                <h4 className="font-medium text-purple-600 mb-1">온보딩 설문</h4>
                <p className="text-muted">온보딩 과정에서 좋았던 점과 개선점을 작성합니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 