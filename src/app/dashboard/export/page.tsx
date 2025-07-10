'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHires, useDepartments } from '@/lib/hooks';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, FileText, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function ExportPage() {
  const { data: hires, isLoading: hiresLoading } = useHires();
  const { data: departments, isLoading: deptLoading } = useDepartments();
  const { toast } = useToast();

  const [selectedFields, setSelectedFields] = useState({
    basicInfo: true,
    personalInfo: true,
    status: true,
    timestamps: false,
  });
  
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exportFormat, setExportFormat] = useState('excel');

  const exportFields = [
    { key: 'basicInfo', label: '기본 정보', description: '이름, 부서, 부서장, 직책, 입사일, 연락처' },
    { key: 'personalInfo', label: '자기기입 정보', description: '보험, 건강검진, 설문 응답' },
    { key: 'status', label: '진행 상태', description: '완료 여부, 진행률' },
    { key: 'timestamps', label: '시간 정보', description: '등록일, 수정일, 삭제일' },
  ];

  const handleFieldChange = (fieldKey: string, checked: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldKey]: checked
    }));
  };

  const filteredHires = hires?.filter(hire => {
    // 부서 필터
    if (filterDepartment !== 'all' && hire.department !== filterDepartment) {
      return false;
    }
    
    // 상태 필터
    if (filterStatus !== 'all') {
      const hasPersonalInfo = hire.personal_info && Array.isArray(hire.personal_info) && hire.personal_info.length > 0;
      if (filterStatus === 'completed' && !hasPersonalInfo) return false;
      if (filterStatus === 'pending' && hasPersonalInfo) return false;
    }
    
    return true;
  }) || [];

  const generateCSV = () => {
    if (!filteredHires.length) {
      toast({
        title: '내보낼 데이터가 없습니다',
        description: '필터 조건을 확인해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [];
    const rows = [];

    // 헤더 생성
    if (selectedFields.basicInfo) {
      headers.push('이름', '부서', '부서장', '직책', '입사일', '연락처', '시용기간종료일');
    }
    if (selectedFields.personalInfo) {
      headers.push('보험가입가족수', '건강검진병원', '건강검진날짜', '좋았던점', '개선점');
    }
    if (selectedFields.status) {
      headers.push('자기기입상태', '진행률');
    }
    if (selectedFields.timestamps) {
      headers.push('등록일', '수정일', '삭제일');
    }

    // 데이터 행 생성
    filteredHires.forEach(hire => {
      const row = [];
      const personalInfo = hire.personal_info?.[0];
      const hasPersonalInfo = personalInfo !== undefined;

      if (selectedFields.basicInfo) {
        row.push(
          hire.name,
          hire.department,
          hire.manager,
          hire.title || '',
          format(new Date(hire.start_date), 'yyyy-MM-dd'),
          hire.contact || '',
          hire.probation_end ? format(new Date(hire.probation_end), 'yyyy-MM-dd') : ''
        );
      }

      if (selectedFields.personalInfo) {
        row.push(
          personalInfo?.insurance_dependents 
            ? Array.isArray(personalInfo.insurance_dependents) 
              ? personalInfo.insurance_dependents.length 
              : '있음'
            : '없음',
          personalInfo?.health_hospital || '',
          personalInfo?.health_date ? format(new Date(personalInfo.health_date), 'yyyy-MM-dd') : '',
          personalInfo?.survey_good || '',
          personalInfo?.survey_pain || ''
        );
      }

      if (selectedFields.status) {
        row.push(
          hasPersonalInfo ? '완료' : '대기',
          hasPersonalInfo ? '100%' : '0%'
        );
      }

      if (selectedFields.timestamps) {
        row.push(
          format(new Date(hire.created_at), 'yyyy-MM-dd HH:mm'),
          format(new Date(hire.updated_at), 'yyyy-MM-dd HH:mm'),
          hire.deleted_at ? format(new Date(hire.deleted_at), 'yyyy-MM-dd HH:mm') : ''
        );
      }

      rows.push(row);
    });

    // CSV 생성
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `온보딩_데이터_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: '내보내기 완료',
      description: `${filteredHires.length}건의 데이터가 CSV 파일로 다운로드되었습니다.`,
    });
  };

  const generateExcel = () => {
    // 실제 환경에서는 xlsx 라이브러리 사용 권장
    toast({
      title: '기능 준비 중',
      description: 'Excel 내보내기 기능은 준비 중입니다. CSV를 이용해주세요.',
      variant: 'destructive',
    });
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      generateCSV();
    } else {
      generateExcel();
    }
  };

  if (hiresLoading || deptLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">데이터 내보내기</h1>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
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
        <div>
          <h1 className="text-2xl font-bold">데이터 내보내기</h1>
          <p className="text-muted">온보딩 데이터를 Excel 또는 CSV 파일로 다운로드하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 내보내기 설정 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 데이터 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  데이터 필터
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>부서 필터</Label>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 부서</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>상태 필터</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 상태</SelectItem>
                        <SelectItem value="completed">자기기입 완료</SelectItem>
                        <SelectItem value="pending">자기기입 대기</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 내보낼 필드 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  내보낼 정보 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportFields.map((field) => (
                  <div key={field.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields[field.key as keyof typeof selectedFields]}
                      onCheckedChange={(checked) => 
                        handleFieldChange(field.key, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={field.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {field.label}
                      </Label>
                      <p className="text-xs text-muted">
                        {field.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 파일 형식 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  파일 형식
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      exportFormat === 'excel' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => setExportFormat('excel')}
                  >
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-medium">Excel (.xlsx)</h3>
                        <p className="text-xs text-muted">Excel에서 바로 열기 가능</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer ${
                      exportFormat === 'csv' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium">CSV (.csv)</h3>
                        <p className="text-xs text-muted">다양한 프로그램 호환</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 미리보기 및 액션 */}
          <div className="space-y-6">
            {/* 데이터 미리보기 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  내보내기 미리보기
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>총 데이터 수:</span>
                    <span className="font-medium">{filteredHires.length}건</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>부서:</span>
                    <span className="font-medium">
                      {filterDepartment === 'all' ? '전체' : filterDepartment}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>상태:</span>
                    <span className="font-medium">
                      {filterStatus === 'all' ? '전체' : 
                       filterStatus === 'completed' ? '완료만' : '대기만'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>파일 형식:</span>
                    <span className="font-medium">{exportFormat.toUpperCase()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">포함될 필드:</h4>
                  <div className="space-y-1">
                    {exportFields.map((field) => (
                      selectedFields[field.key as keyof typeof selectedFields] && (
                        <div key={field.key} className="text-xs text-muted flex items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                          {field.label}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 내보내기 버튼 */}
            <Card>
              <CardContent className="p-6">
                <Button 
                  onClick={handleExport}
                  className="w-full btn-primary"
                  disabled={filteredHires.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportFormat === 'excel' ? 'Excel로 다운로드' : 'CSV로 다운로드'}
                </Button>

                <p className="text-xs text-muted text-center mt-3">
                  파일명: 온보딩_데이터_{format(new Date(), 'yyyy-MM-dd')}.{exportFormat === 'excel' ? 'xlsx' : 'csv'}
                </p>
              </CardContent>
            </Card>

            {/* 안내사항 */}
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">안내사항</h3>
                <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                  <li>개인정보가 포함된 파일이므로 보안에 주의하세요</li>
                  <li>CSV 파일은 UTF-8 인코딩으로 저장됩니다</li>
                  <li>Excel에서 CSV 열 때 인코딩 문제가 있으면 메모장으로 먼저 열어보세요</li>
                  <li>대용량 데이터의 경우 시간이 소요될 수 있습니다</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 