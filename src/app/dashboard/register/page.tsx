'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateHire, useDepartments2 } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { sendNewHireEmail } from '@/lib/email-service';
import { department2Api } from '@/lib/api';
import { logger } from '@/lib/logger';

// 폼 스키마 정의
const hireFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요').optional().or(z.literal('')),
  department: z.string().min(1, '부서를 선택해주세요'),
  manager: z.string().min(1, '부서장명이 설정되지 않았습니다'),
  title: z.string().optional(),
  start_date: z.string().min(1, '입사일을 선택해주세요'),
  contact: z.string().optional(),
  probation_end: z.string().optional(),
});

type HireFormData = z.infer<typeof hireFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useDepartments2();

  // 부서 데이터 로딩 상태 로깅
  logger.debug('부서 데이터 로딩 상태', {
    module: 'RegisterPage',
    action: 'department-loading',
    data: { 
      hasData: !!departments,
      isLoading: departmentsLoading,
      hasError: !!departmentsError,
      departmentCount: departments?.length || 0
    }
  });
  const createHireMutation = useCreateHire();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');



  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HireFormData>({
    resolver: zodResolver(hireFormSchema),
  });

  // 부서 선택 시 자동으로 부서장 설정
  const watchedDepartment = watch('department');
  
  useEffect(() => {
    if (watchedDepartment && departments) {
      const selectedDept = departments.find(dept => dept.name === watchedDepartment);
      if (selectedDept) {
        setValue('manager', selectedDept.manager_name);
      }
    }
  }, [watchedDepartment, departments, setValue]);

  const onSubmit = async (data: HireFormData) => {
    try {
      // 1. 입사자 정보 등록
      const newHire = await createHireMutation.mutateAsync({
        name: data.name,
        email: data.email || null,
        department: data.department,
        manager: data.manager,
        title: data.title || null,
        start_date: data.start_date,
        contact: data.contact || null,
        // 시용기간 계산 (입사일로부터 3개월 후)
        probation_end: data.probation_end || 
          format(new Date(new Date(data.start_date).getTime() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
      
      // 2. 부서 정보 조회 (부서장 이메일 포함)
      let departmentInfo;
      try {
        departmentInfo = await department2Api.getByName(data.department);
      } catch (deptError) {
        console.error('부서 정보 조회 실패:', deptError);
        // 부서 정보 조회 실패해도 등록은 성공이므로 계속 진행
      }
      
      // 3. 입사예정자 자동 이메일 발송 (이메일 주소가 있는 경우만)
      if (newHire.email && departmentInfo) {
        try {
          const emailResult = await sendNewHireEmail(newHire, departmentInfo);
          
          if (emailResult.success) {
            toast({
              title: '등록 및 이메일 발송 완료',
              description: `${data.name}님의 정보가 등록되고 입사안내 이메일이 발송되었습니다.`,
            });
          } else {
            toast({
              title: '등록 완료, 이메일 발송 실패',
              description: `${data.name}님의 정보는 등록되었으나 이메일 발송에 실패했습니다.`,
              variant: 'destructive',
            });
          }
        } catch (emailError) {
          console.error('이메일 발송 에러:', emailError);
          toast({
            title: '등록 완료, 이메일 발송 실패',
            description: `${data.name}님의 정보는 등록되었으나 이메일 발송 중 오류가 발생했습니다.`,
            variant: 'destructive',
          });
        }
      } else {
        // 이메일 주소가 없거나 부서 정보가 없는 경우
        const reason = !newHire.email ? '이메일 주소가 없어' : '부서 정보 조회에 실패하여';
        toast({
          title: '등록 완료',
          description: `${data.name}님의 정보가 등록되었습니다. (${reason} 자동 이메일은 발송되지 않았습니다)`,
        });
      }
      
      reset();
      router.push('/dashboard/list');
    } catch (error) {
      console.error('입사자 등록 에러:', error);
      toast({
        title: '등록 실패',
        description: '입사자 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold">신규입사자 등록</h1>
          <p className="text-muted">새로운 입사자의 기본 정보를 입력하세요</p>
        </div>

        {/* 등록 폼 */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>기본 정보 입력</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 첫 번째 행: 이름, 이메일 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="홍길동"
                    className={errors.name ? 'border-error' : 'input-focus'}
                  />
                  {errors.name && (
                    <p className="text-sm text-error">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="hong@company.com"
                    className={errors.email ? 'border-error' : 'input-focus'}
                  />
                  {errors.email && (
                    <p className="text-sm text-error">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* 두 번째 행: 부서, 부서장 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">부서 *</Label>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.department ? 'border-error' : 'input-focus'}>
                          <SelectValue placeholder={
                            departmentsLoading ? "부서 정보 로딩 중..." :
                            departmentsError ? "부서 정보 로드 실패" :
                            departments?.length === 0 ? "등록된 부서가 없습니다" :
                            "부서 선택"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {!departmentsLoading && !departmentsError && departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                          {!departmentsLoading && !departmentsError && departments?.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              등록된 부서가 없습니다
                            </div>
                          )}
                          {departmentsError && (
                            <div className="px-2 py-1.5 text-sm text-red-500">
                              부서 정보 로드 실패
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.department && (
                    <p className="text-sm text-error">{errors.department.message}</p>
                  )}
                  {departmentsError && (
                    <p className="text-sm text-red-500">
                      부서 정보를 불러오는데 실패했습니다: {departmentsError.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">부서장 *</Label>
                  <Input
                    id="manager"
                    {...register('manager')}
                    placeholder="부서를 선택하면 자동으로 설정됩니다"
                    className={errors.manager ? 'border-error' : 'input-focus bg-muted'}
                    readOnly
                  />
                  {errors.manager && (
                    <p className="text-sm text-error">{errors.manager.message}</p>
                  )}
                  {watchedDepartment && (
                    <p className="text-xs text-muted">
                      선택된 부서: {watchedDepartment}
                    </p>
                  )}
                </div>
              </div>

              {/* 세 번째 행: 직책, 연락처 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">직책</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="예: 주임, 대리, 과장 등"
                    className="input-focus"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">연락처</Label>
                  <Input
                    id="contact"
                    {...register('contact')}
                    placeholder="010-1234-5678"
                    className="input-focus"
                  />
                </div>
              </div>

              {/* 네 번째 행: 입사일, 시용기간 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">입사일 *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date')}
                    className={errors.start_date ? 'border-error' : 'input-focus'}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-error">{errors.start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probation_end">시용기간 종료일</Label>
                  <Input
                    id="probation_end"
                    type="date"
                    {...register('probation_end')}
                    className="input-focus"
                  />
                  <p className="text-xs text-muted">
                    미입력 시 입사일로부터 3개월 후로 자동 설정됩니다
                  </p>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={isSubmitting}
                >
                  초기화
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? '등록 중...' : '등록하기'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="max-w-2xl bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">등록 후 진행 사항</h3>
            <ul className="text-sm text-muted space-y-1 list-disc list-inside">
              <li>등록 완료 후 입사자 목록에서 확인 가능합니다</li>
              <li>입사자는 자기기입 메뉴에서 개인정보를 입력할 수 있습니다</li>
              <li>부서별 이메일 발송 기능을 통해 관련 부서에 알림을 보낼 수 있습니다</li>
              <li>시용기간 종료 전 자동 리마인더가 발송됩니다</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 