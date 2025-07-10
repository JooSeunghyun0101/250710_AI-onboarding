import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 자기기입 진행률 계산 유틸리티
export interface PersonalInfoData {
  insurance_dependents?: any;
  health_hospital?: string;
  health_date?: string;
  survey_good?: string;
  survey_pain?: string;
}

export interface SelfEntryProgress {
  completed: number;
  total: number;
  percentage: number;
  status: 'pending' | 'partial' | 'completed';
  stepCompletion: {
    step1: boolean; // 보험 정보
    step2: boolean; // 건강검진
    step3: boolean; // 설문
  };
}

export function calculateSelfEntryProgress(personalInfo?: PersonalInfoData): SelfEntryProgress {
  if (!personalInfo) {
    return {
      completed: 0,
      total: 3,
      percentage: 0,
      status: 'pending',
      stepCompletion: {
        step1: false,
        step2: false,
        step3: false,
      },
    };
  }

  // 단계별 완료 여부 확인
  const stepCompletion = {
    // 1단계: 보험 정보 (가족 구성원이 있거나, personal_info가 존재하면 시작으로 간주)
    step1: !!(personalInfo.insurance_dependents && 
              Array.isArray(personalInfo.insurance_dependents) && 
              personalInfo.insurance_dependents.length > 0) || 
            // 가족이 없어도 자기기입을 시작했다면 1단계 완료로 처리
            !!(personalInfo.health_hospital || personalInfo.health_date || 
               personalInfo.survey_good || personalInfo.survey_pain),
    
    // 2단계: 건강검진 (병원과 날짜 둘 다 필요)
    step2: !!(personalInfo.health_hospital && personalInfo.health_date),
    
    // 3단계: 설문 (좋았던 점이나 개선점 중 하나라도 있으면 완료)
    step3: !!(personalInfo.survey_good?.trim() || personalInfo.survey_pain?.trim()),
  };

  // 완료된 단계 수 계산
  const completed = Object.values(stepCompletion).filter(Boolean).length;
  const total = 3;
  const percentage = Math.round((completed / total) * 100);

  // 상태 결정
  let status: 'pending' | 'partial' | 'completed' = 'pending';
  if (percentage === 100) {
    status = 'completed';
  } else if (percentage > 0) {
    status = 'partial';
  }

  return {
    completed,
    total,
    percentage,
    status,
    stepCompletion,
  };
}

// 현재 단계와 실제 데이터를 기반으로 진행률 계산 (자기기입 상세 페이지용)
export function calculateCurrentStepProgress(
  currentStep: number,
  personalInfo?: PersonalInfoData
): { percentage: number; currentStepCompleted: boolean } {
  const progress = calculateSelfEntryProgress(personalInfo);
  
  // 현재 단계가 완료되었는지 확인
  let currentStepCompleted = false;
  switch (currentStep) {
    case 1:
      currentStepCompleted = progress.stepCompletion.step1;
      break;
    case 2:
      currentStepCompleted = progress.stepCompletion.step2;
      break;
    case 3:
      currentStepCompleted = progress.stepCompletion.step3;
      break;
  }

  // 실제 완료된 단계 기준으로 진행률 계산
  let percentage = 0;
  
  if (progress.stepCompletion.step1) percentage = Math.max(percentage, 33);
  if (progress.stepCompletion.step2) percentage = Math.max(percentage, 67);
  if (progress.stepCompletion.step3) percentage = 100;
  
  // 현재 단계가 아직 완료되지 않았다면, 최소 현재 단계의 시작 진행률 보장
  if (!currentStepCompleted) {
    const basePercentage = (currentStep - 1) * 33;
    percentage = Math.max(percentage, basePercentage);
  }

  return {
    percentage,
    currentStepCompleted,
  };
}
