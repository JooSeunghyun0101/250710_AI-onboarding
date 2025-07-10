'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useHires } from '@/lib/hooks';
import { calculateSelfEntryProgress } from '@/lib/utils';
import { useState } from 'react';
import { Search, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { EmailSender } from '@/components/email-sender';

export default function HireListPage() {
  const { data: hires, isLoading } = useHires();
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 필터링
  const filteredHires = hires?.filter(hire =>
    hire.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hire.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hire.manager.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (hire: any) => {
    // personal_info는 1:1 관계이므로 배열이지만 실제로는 첫 번째 요소만 사용
    const personalInfo = hire.personal_info?.[0] || hire.personal_info;
    const progress = calculateSelfEntryProgress(personalInfo);
    
    switch (progress.status) {
      case 'completed':
        return <Badge className="bg-green-600 text-white">자기기입 완료</Badge>;
      case 'partial':
        return <Badge variant="outline" className="text-orange-600">진행 중 ({progress.percentage}%)</Badge>;
      default:
        return <Badge variant="outline" className="text-red-600">자기기입 대기</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">입사자 목록</h1>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">입사자 목록</h1>
            <p className="text-muted">전체 {hires?.length || 0}명의 입사자가 등록되어 있습니다</p>
          </div>
          <Link href="/dashboard/register">
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              신규 등록
            </Button>
          </Link>
        </div>

        {/* 검색 */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
              <Input
                placeholder="이름, 부서, 부서장으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 입사자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>입사자 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHires.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted">등록된 입사자가 없습니다.</p>
                <Link href="/dashboard/register">
                  <Button variant="outline" className="mt-4">
                    첫 번째 입사자 등록하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">이름</th>
                      <th className="text-left py-3 px-4 font-medium">이메일</th>
                      <th className="text-left py-3 px-4 font-medium">부서</th>
                      <th className="text-left py-3 px-4 font-medium">부서장</th>
                      <th className="text-left py-3 px-4 font-medium">직책</th>
                      <th className="text-left py-3 px-4 font-medium">입사일</th>
                      <th className="text-left py-3 px-4 font-medium">상태</th>
                      <th className="text-left py-3 px-4 font-medium">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHires.map((hire) => (
                      <tr key={hire.id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{hire.name}</td>
                        <td className="py-3 px-4">
                          {hire.email ? (
                            <a 
                              href={`mailto:${hire.email}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {hire.email}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{hire.department}</td>
                        <td className="py-3 px-4">{hire.manager}</td>
                        <td className="py-3 px-4">{hire.title || '-'}</td>
                        <td className="py-3 px-4">
                          {format(new Date(hire.start_date), 'yyyy-MM-dd')}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(hire)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/list/${hire.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                상세
                              </Button>
                            </Link>
                            <EmailSender 
                              hire={hire}
                              personalInfo={hire.personal_info?.[0] || hire.personal_info}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 요약 통계 */}
        {filteredHires.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">전체 입사자</h3>
                <div className="text-2xl font-bold text-primary">{filteredHires.length}명</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">자기기입 완료</h3>
                <div className="text-2xl font-bold text-green-600">
                  {filteredHires.filter(h => {
                    const personalInfo = h.personal_info?.[0] || h.personal_info;
                    const progress = calculateSelfEntryProgress(personalInfo);
                    return progress.status === 'completed';
                  }).length}명
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">완료율</h3>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((filteredHires.filter(h => {
                    const personalInfo = h.personal_info?.[0] || h.personal_info;
                    const progress = calculateSelfEntryProgress(personalInfo);
                    return progress.status === 'completed';
                  }).length / filteredHires.length) * 100)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 