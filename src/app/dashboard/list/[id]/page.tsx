'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHire, usePersonalInfo, useEmailLogs, useDepartments2, useDepartment2ByName } from '@/lib/hooks';
import { ArrowLeft, Mail, Calendar, User, Building, Phone, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { emailLogApi } from '@/lib/api';
import { EmailSender } from '@/components/email-sender';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// 이메일 타입 라벨 매핑
const EMAIL_TYPE_LABELS = {
  'new_hire': '신규 입사자 환영',
  'insurance': '단체보험 담당자',
  'health_check': '건강검진 담당자', 
  'department': '유관부서 및 해당부서장',
  'department_notification': '부서 알림',
  'welcome_guide': '출근 안내',
} as const;

const EMAIL_TYPE_COLORS = {
  'new_hire': 'bg-blue-100 text-blue-800',
  'insurance': 'bg-green-100 text-green-800',
  'health_check': 'bg-purple-100 text-purple-800',
  'department': 'bg-orange-100 text-orange-800',
  'department_notification': 'bg-orange-100 text-orange-800',
  'welcome_guide': 'bg-blue-100 text-blue-800',
} as const;

export default function HireDetailPage() {
  const params = useParams();
  const hireId = params.id as string;
  const { toast } = useToast();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: hire, isLoading: hireLoading } = useHire(hireId);
  const { data: personalInfo, isLoading: personalLoading } = usePersonalInfo(hireId);
  const { data: emailLogs, isLoading: emailLoading } = useEmailLogs(hireId);
  const { data: departmentInfo } = useDepartment2ByName(hire?.department || '');

  // 부서 메일 발송 함수
  const handleSendDepartmentEmail = async () => {
    if (!hire || !departmentInfo) {
      toast({
        title: '발송 실패',
        description: '부서 정보를 찾을 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsEmailSending(true);
    try {
      // 이메일 로그 생성
      await emailLogApi.create({
        hire_id: hire.id,
        email_type: 'department_notification',
        status: 'success',
        sent_at: new Date().toISOString(),
      });

      toast({
        title: '메일 발송 완료',
        description: `${departmentInfo.manager_name} 부서장(${departmentInfo.manager_email})에게 입사자 정보가 발송되었습니다.`,
      });

      // 이메일 로그 갱신
      queryClient.invalidateQueries({ queryKey: ['email-logs', hireId] });

      // 부서장 이메일 발송 완료 (Make.com 웹훅 호출)

    } catch (error) {
      await emailLogApi.create({
        hire_id: hire.id,
        email_type: 'department_notification',
        status: 'failed',
        sent_at: new Date().toISOString(),
      });

      toast({
        title: '발송 실패',
        description: '메일 발송 중 오류가 발생했습니다.',
        variant: 'destructive',
      });

      // 이메일 로그 갱신
      queryClient.invalidateQueries({ queryKey: ['email-logs', hireId] });
    } finally {
      setIsEmailSending(false);
    }
  };

  // 출근 안내 메일 발송 함수
  const handleSendWelcomeEmail = async () => {
    if (!hire) return;

    setIsEmailSending(true);
    try {
      await emailLogApi.create({
        hire_id: hire.id,
        email_type: 'welcome_guide',
        status: 'success',
        sent_at: new Date().toISOString(),
      });

      toast({
        title: '출근 안내 발송 완료',
        description: `${hire.name}님에게 출근 안내 메일이 발송되었습니다.`,
      });

      // 이메일 로그 갱신
      queryClient.invalidateQueries({ queryKey: ['email-logs', hireId] });

    } catch (error) {
      await emailLogApi.create({
        hire_id: hire.id,
        email_type: 'welcome_guide',
        status: 'failed',
        sent_at: new Date().toISOString(),
      });

      toast({
        title: '발송 실패',
        description: '메일 발송 중 오류가 발생했습니다.',
        variant: 'destructive',
      });

      // 이메일 로그 갱신
      queryClient.invalidateQueries({ queryKey: ['email-logs', hireId] });
    } finally {
      setIsEmailSending(false);
    }
  };

  // 이메일 상태 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  // 이메일 타입별 발송 상태 계산
  const getEmailStatusByType = () => {
    if (!emailLogs) return {};
    
    const statusByType = {} as Record<string, { status: string; sent_at?: string; latest: boolean }>;
    
    emailLogs.forEach((log) => {
      const existing = statusByType[log.email_type];
      if (!existing || (log.sent_at && new Date(log.sent_at) > new Date(existing.sent_at || ''))) {
        statusByType[log.email_type] = {
          status: log.status,
          sent_at: log.sent_at,
          latest: true
        };
      }
    });
    
    return statusByType;
  };

  const emailStatusByType = getEmailStatusByType();

  if (hireLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hire) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">입사자를 찾을 수 없습니다</h1>
          <Link href="/dashboard/list">
            <Button variant="outline">목록으로 돌아가기</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const hasPersonalInfo = personalInfo !== null && personalInfo !== undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/list">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{hire.name}님 상세정보</h1>
            <p className="text-muted">{hire.department} • {hire.manager}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted" />
                <span className="font-medium">이름:</span>
                <span>{hire.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted" />
                <span className="font-medium">이메일:</span>
                {hire.email ? (
                  <a 
                    href={`mailto:${hire.email}`} 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {hire.email}
                  </a>
                ) : (
                  <span className="text-muted">미등록</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-muted" />
                <span className="font-medium">부서:</span>
                <span>{hire.department}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted" />
                <span className="font-medium">부서장:</span>
                <span>{hire.manager}</span>
              </div>
              
              {hire.title && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">직책:</span>
                  <span>{hire.title}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted" />
                <span className="font-medium">입사일:</span>
                <span>{format(new Date(hire.start_date), 'yyyy-MM-dd')}</span>
              </div>
              
              {hire.probation_end && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted" />
                  <span className="font-medium">시용기간:</span>
                  <span>{format(new Date(hire.probation_end), 'yyyy-MM-dd')}</span>
                </div>
              )}
              
              {hire.contact && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted" />
                  <span className="font-medium">연락처:</span>
                  <span>{hire.contact}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 자기기입 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>자기기입 정보</span>
                {hasPersonalInfo ? (
                  <Badge className="bg-green-600 text-white">완료</Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600">대기 중</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personalLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ) : hasPersonalInfo ? (
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-sm text-muted">보험 대상자:</span>
                    <div className="mt-1">
                      {personalInfo.insurance_dependents ? (
                        <div className="text-sm">
                          {Array.isArray(personalInfo.insurance_dependents) 
                            ? `${personalInfo.insurance_dependents.length}명 등록됨`
                            : '정보 있음'
                          }
                        </div>
                      ) : (
                        <span className="text-muted text-sm">미등록</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="font-medium text-sm text-muted">건강검진:</span>
                    <div className="mt-1 space-y-1">
                      <div className="text-sm">
                        병원: {personalInfo.health_hospital || '미선택'}
                      </div>
                      <div className="text-sm">
                        날짜: {personalInfo.health_date 
                          ? format(new Date(personalInfo.health_date), 'yyyy-MM-dd')
                          : '미선택'
                        }
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="font-medium text-sm text-muted">설문 응답:</span>
                    <div className="mt-1 space-y-2">
                      {personalInfo.survey_good && (
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">좋았던 점:</span>
                          <p className="mt-1 text-muted">{personalInfo.survey_good}</p>
                        </div>
                      )}
                      {personalInfo.survey_pain && (
                        <div className="text-sm">
                          <span className="text-orange-600 font-medium">불편했던 점:</span>
                          <p className="mt-1 text-muted">{personalInfo.survey_pain}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted text-sm mb-4">아직 자기기입 정보가 입력되지 않았습니다.</p>
                  <Link href={`/dashboard/self-entry/${hire.id}`}>
                    <Button variant="outline" size="sm">
                      자기기입 화면으로
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 메일 발송 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                메일 발송 현황
              </div>
              <div className="flex items-center space-x-2">
                {hire && personalInfo && (
                  <EmailSender hire={hire} personalInfo={personalInfo} />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 이메일 타입별 상태 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(EMAIL_TYPE_LABELS).map(([type, label]) => {
                    const status = emailStatusByType[type];
                    return (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status?.status || 'pending')}
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                        </div>
                        <Badge 
                          className={`text-xs ${EMAIL_TYPE_COLORS[type as keyof typeof EMAIL_TYPE_COLORS] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {status ? (
                            status.status === 'success' || status.status === 'sent' ? '발송 완료' :
                            status.status === 'failed' ? '발송 실패' : '대기 중'
                          ) : '미발송'}
                        </Badge>
                        {status?.sent_at && (
                          <div className="text-xs text-muted mt-1">
                            {format(new Date(status.sent_at), 'MM-dd HH:mm')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* 상세 발송 이력 */}
                <div>
                  <h4 className="font-medium mb-3">상세 발송 이력</h4>
                  {emailLogs && emailLogs.length > 0 ? (
                    <div className="space-y-3">
                      {emailLogs
                        .sort((a, b) => new Date(b.sent_at || '').getTime() - new Date(a.sent_at || '').getTime())
                        .map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(log.status)}
                              <div>
                                <div className="font-medium text-sm">
                                  {EMAIL_TYPE_LABELS[log.email_type as keyof typeof EMAIL_TYPE_LABELS] || log.email_type}
                                </div>
                                {log.sent_at && (
                                  <div className="text-xs text-muted">
                                    {format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm:ss')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant={log.status === 'success' || log.status === 'sent' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {log.status === 'success' || log.status === 'sent' ? '성공' :
                               log.status === 'failed' ? '실패' : log.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted">
                      <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">아직 발송된 이메일이 없습니다.</p>
                      <p className="text-xs mt-1">위의 이메일 발송 버튼을 사용해 이메일을 발송해보세요.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 빠른 작업 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">빠른 작업</h3>
                {departmentInfo && (
                  <p className="text-sm text-muted mt-1">
                    부서장: {departmentInfo.manager_name} ({departmentInfo.manager_email})
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Link href={`/dashboard/self-entry/${hire.id}`}>
                  <Button variant="outline" size="sm">
                    자기기입 화면
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSendWelcomeEmail}
                  disabled={isEmailSending}
                >
                  {isEmailSending ? '발송 중...' : '출근 안내 발송'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 