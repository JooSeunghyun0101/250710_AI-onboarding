'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useHire, usePersonalInfo, useUpsertPersonalInfo } from '@/lib/hooks';
import { calculateCurrentStepProgress } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Plus, Trash2, User, Heart, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// 폼 스키마 정의
const personalInfoSchema = z.object({
  insurance_dependents: z.array(z.object({
    name: z.string().min(1, '이름을 입력해주세요'),
    ssn: z.string().min(1, '주민번호를 입력해주세요'),
    relationship: z.string().min(1, '관계를 선택해주세요'),
  })).optional(),
  health_hospital: z.string().optional(),
  health_date: z.string().optional(),
  survey_good: z.string().optional(),
  survey_pain: z.string().optional(),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

const hospitals = [
  '서울대학교병원',
  '서울아산병원',
  '삼성서울병원',
  '세브란스병원',
  '서울성모병원',
  '강남세브란스병원',
  '분당서울대병원',
  '기타 (직접 입력)'
];

const relationships = [
  '배우자',
  '자녀',
  '부모',
  '형제/자매',
  '기타'
];

export default function SelfEntryFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const hireId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormSubmittedByUser, setIsFormSubmittedByUser] = useState(false);
  const totalSteps = 3;
  
  const { data: hire, isLoading: hireLoading } = useHire(hireId);
  const { data: personalInfo, isLoading: personalLoading } = usePersonalInfo(hireId);
  const upsertPersonalInfoMutation = useUpsertPersonalInfo();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      insurance_dependents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'insurance_dependents',
  });

  // 기존 데이터 로드
  useEffect(() => {
    if (personalInfo) {
      if (personalInfo.insurance_dependents) {
        setValue('insurance_dependents', personalInfo.insurance_dependents as any);
      }
      if (personalInfo.health_hospital) {
        setValue('health_hospital', personalInfo.health_hospital);
      }
      if (personalInfo.health_date) {
        setValue('health_date', personalInfo.health_date);
      }
      
      // 3단계에서만 설문 데이터 로드
      if (currentStep === 3) {
        if (personalInfo.survey_good) {
          setValue('survey_good', personalInfo.survey_good);
        }
        if (personalInfo.survey_pain) {
          setValue('survey_pain', personalInfo.survey_pain);
        }
      }
    }
  }, [personalInfo, setValue, currentStep]);

  const onSubmit = async (data: PersonalInfoFormData) => {
    // 사용자가 명시적으로 제출한 경우가 아니라면 중단
    if (!isFormSubmittedByUser) {
      return;
    }

    try {
      await upsertPersonalInfoMutation.mutateAsync({
        hire_id: hireId,
        insurance_dependents: data.insurance_dependents || null,
        health_hospital: data.health_hospital || null,
        health_date: data.health_date || null,
        survey_good: data.survey_good || null,
        survey_pain: data.survey_pain || null,
      });

      toast({
        title: '저장 완료',
        description: '자기기입 정보가 성공적으로 저장되었습니다.',
      });

      // 캐시 무효화가 완료될 시간을 주기 위해 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push('/dashboard/self-entry');
    } catch (error) {
      console.error('[자기기입] 저장 실패', error);
      toast({
        title: '저장 실패',
        description: '정보 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsFormSubmittedByUser(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addDependent = () => {
    append({ name: '', ssn: '', relationship: '' });
  };

  const handleFormSubmit = () => {
    setIsFormSubmittedByUser(true);
  };

  if (hireLoading || personalLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
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
          <Link href="/dashboard/self-entry">
            <Button variant="outline">자기기입 관리로 돌아가기</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const progressData = calculateCurrentStepProgress(currentStep, personalInfo);
  const progress = progressData.percentage;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/self-entry">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{hire.name}님 자기기입</h1>
            <p className="text-muted">{hire.department} • 단계 {currentStep} / {totalSteps}</p>
          </div>
        </div>

        {/* 진행률 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">진행률</span>
              <span className="text-sm text-muted">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between mt-4 text-sm">
              <div className={`flex items-center space-x-2 ${
                progressData.currentStepCompleted && currentStep === 1 
                  ? 'text-green-600' 
                  : currentStep >= 1 
                    ? 'text-primary' 
                    : 'text-muted'
              }`}>
                <User className="w-4 h-4" />
                <span>보험 정보</span>
                {personalInfo && <CheckCircle className="w-3 h-3 text-green-600" />}
              </div>
              <div className={`flex items-center space-x-2 ${
                progressData.currentStepCompleted && currentStep === 2 
                  ? 'text-green-600' 
                  : currentStep >= 2 
                    ? 'text-primary' 
                    : 'text-muted'
              }`}>
                <Heart className="w-4 h-4" />
                <span>건강검진</span>
                {personalInfo?.health_hospital && personalInfo?.health_date && <CheckCircle className="w-3 h-3 text-green-600" />}
              </div>
              <div className={`flex items-center space-x-2 ${
                progressData.currentStepCompleted && currentStep === 3 
                  ? 'text-green-600' 
                  : currentStep >= 3 
                    ? 'text-primary' 
                    : 'text-muted'
              }`}>
                <FileText className="w-4 h-4" />
                <span>설문</span>
                {(personalInfo?.survey_good || personalInfo?.survey_pain) && <CheckCircle className="w-3 h-3 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 폼 컨텐츠 */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 1단계: 보험 정보 */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  보험 정보 입력
                </CardTitle>
                <p className="text-sm text-muted">직계가족의 단체보험 가입을 위한 정보를 입력해주세요.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">가족 구성원</h3>
                  <Button type="button" onClick={addDependent} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    가족 추가
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                    <User className="w-8 h-8 text-muted mx-auto mb-2" />
                    <p className="text-muted">단체보험에 가입할 가족이 없다면 이 단계를 건너뛸 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">가족 구성원 {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => remove(index)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`dependents.${index}.name`}>이름</Label>
                            <Input
                              {...register(`insurance_dependents.${index}.name`)}
                              placeholder="홍길동"
                              className="input-focus"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`dependents.${index}.ssn`}>주민번호</Label>
                            <Input
                              {...register(`insurance_dependents.${index}.ssn`)}
                              placeholder="900101-1234567"
                              className="input-focus"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`dependents.${index}.relationship`}>관계</Label>
                            <Controller
                              name={`insurance_dependents.${index}.relationship`}
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="input-focus">
                                    <SelectValue placeholder="관계 선택" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {relationships.map((rel) => (
                                      <SelectItem key={rel} value={rel}>
                                        {rel}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 2단계: 건강검진 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  건강검진 예약
                </CardTitle>
                <p className="text-sm text-muted">채용검진을 받을 병원과 희망 날짜를 선택해주세요.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="health_hospital">병원 선택</Label>
                    <Controller
                      name="health_hospital"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="input-focus">
                            <SelectValue placeholder="병원을 선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {hospitals.map((hospital) => (
                              <SelectItem key={hospital} value={hospital}>
                                {hospital}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="health_date">희망 날짜</Label>
                    <Input
                      type="date"
                      {...register('health_date')}
                      className="input-focus"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">안내사항</h4>
                  <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                    <li>채용검진은 입사 후 1개월 이내에 완료해야 합니다</li>
                    <li>검진 결과는 인사팀으로 직접 제출해주세요</li>
                    <li>검진 비용은 회사에서 지원됩니다</li>
                    <li>기타 문의사항은 인사팀으로 연락해주세요</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3단계: 설문 */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  온보딩 설문
                </CardTitle>
                <p className="text-sm text-muted">온보딩 과정에 대한 피드백을 작성해주세요.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="survey_good">좋았던 점</Label>
                  <Textarea
                    {...register('survey_good')}
                    placeholder="온보딩 과정에서 좋았던 점이나 도움이 되었던 부분을 작성해주세요..."
                    className="input-focus min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="survey_pain">개선되었으면 하는 점</Label>
                  <Textarea
                    {...register('survey_pain')}
                    placeholder="불편했던 점이나 개선되었으면 하는 부분을 작성해주세요..."
                    className="input-focus min-h-[120px]"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800">피드백 활용</h4>
                  <p className="text-sm text-blue-700">
                    작성해주신 피드백은 향후 온보딩 프로세스 개선에 소중하게 활용됩니다. 
                    솔직하고 구체적인 의견을 남겨주시면 큰 도움이 됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 네비게이션 버튼 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>

                <div className="flex space-x-4">
                  {currentStep < totalSteps ? (
                    <Button type="button" onClick={nextStep} className="btn-primary">
                      다음
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary"
                      onClick={handleFormSubmit}
                    >
                      {isSubmitting ? '저장 중...' : '완료'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
} 