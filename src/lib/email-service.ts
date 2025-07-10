'use client';

import { supabase } from './supabase';
import { logger } from './logger';
import type { Hire, PersonalInfo, Department2 } from './api';

// 이메일 타입 상수
export const EMAIL_TYPES = {
  NEW_HIRE: 'new_hire',           // 입사예정자
  INSURANCE: 'insurance',         // 단체보험 담당자
  HEALTH_CHECK: 'health_check',   // 건강검진 담당자
  DEPARTMENT: 'department',       // 유관부서 및 해당부서장
} as const;

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];

// 웹훅 URL
const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/onldoy6jbivfmt5h7sdqacwxvqq6xqjz';

// 이메일 발송 페이로드 타입
interface EmailPayload {
  // MAKE.com에서 액션 구분을 위한 메타데이터
  action: {
    type: 'auto' | 'manual';           // 자동발송 vs 수동발송
    source: 'registration' | 'employee_list';  // 어디서 호출되었는지
    target: 'new_hire' | 'insurance_manager' | 'health_manager' | 'department_manager';  // 누구에게 보내는지
    emailType: EmailType;              // 기존 이메일 타입
    description: string;               // 액션 설명
  };
  
  // 기존 데이터
  hire: Hire;
  personalInfo?: PersonalInfo;
  department: Department2;
  recipientEmail?: string;
  timestamp: string;
}

// 웹훅 페이로드 생성 함수
export function createEmailPayload(
  emailType: EmailType,
  hire: Hire,
  department: Department2,
  actionType: 'auto' | 'manual',
  source: 'registration' | 'employee_list',
  personalInfo?: PersonalInfo,
  recipientEmail?: string
): EmailPayload {
  // 액션 구성 정보
  const actionConfig = {
    [EMAIL_TYPES.NEW_HIRE]: { 
      target: 'new_hire' as const, 
      description: '신규입사자에게 환영 메일 발송' 
    },
    [EMAIL_TYPES.INSURANCE]: { 
      target: 'insurance_manager' as const, 
      description: '단체보험 담당자에게 입사자 정보 전달' 
    },
    [EMAIL_TYPES.HEALTH_CHECK]: { 
      target: 'health_manager' as const, 
      description: '건강검진 담당자에게 입사자 정보 전달' 
    },
    [EMAIL_TYPES.DEPARTMENT]: { 
      target: 'department_manager' as const, 
      description: '유관부서 및 해당부서장에게 입사자 정보 전달' 
    },
  };

  const config = actionConfig[emailType];

  return {
    action: {
      type: actionType,
      source,
      target: config.target,
      emailType,
      description: config.description,
    },
    hire,
    personalInfo,
    department,
    recipientEmail,
    timestamp: new Date().toISOString(),
  };
}

// 웹훅 호출 함수
export async function sendWebhook(payload: EmailPayload): Promise<{
  success: boolean;
  status?: number;
  error?: string;
}> {
  try {
    logger.debug('웹훅 발송 시작', {
      module: 'EmailService',
      action: 'webhook-send',
      data: { emailType: payload.action.emailType, hireName: payload.hire.name }
    });
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const success = response.ok;
    
    if (success) {
      logger.debug('웹훅 발송 성공', {
        module: 'EmailService',
        action: 'webhook-success',
        data: { status: response.status, emailType: payload.action.emailType }
      });
    } else {
      logger.warn('웹훅 발송 실패', {
        module: 'EmailService',
        action: 'webhook-failure',
        data: { status: response.status, statusText: response.statusText }
      });
    }
    
    return {
      success,
      status: response.status,
      error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    logger.error('웹훅 발송 에러', error, {
      module: 'EmailService',
      action: 'webhook-error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// 이메일 로그 저장 함수
export async function logEmailSent(
  hireId: string,
  emailType: EmailType,
  status: 'pending' | 'sent' | 'failed' = 'pending'
) {
  try {
    const { data, error } = await supabase
      .from('email_log')
      .insert({
        hire_id: hireId,
        email_type: emailType,
        status,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('이메일 로그 저장 에러', error, {
      module: 'EmailService',
      action: 'log-save-error',
      data: { hireId, emailType, status }
    });
    throw error;
  }
}

// 웹훅 이벤트 로그 저장 함수
export async function logWebhookEvent(
  hireId: string,
  payload: EmailPayload,
  responseStatus?: number
) {
  try {
    const { data, error } = await supabase
      .from('webhook_event')
      .insert({
        hire_id: hireId,
        endpoint: WEBHOOK_URL,
        payload: JSON.parse(JSON.stringify(payload)),
        response_status: responseStatus,
        retries: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('웹훅 이벤트 로그 저장 에러', error, {
      module: 'EmailService',
      action: 'webhook-log-error',
      data: { hireId, responseStatus }
    });
    throw error;
  }
}

// 통합 이메일 발송 함수
export async function sendEmail(
  emailType: EmailType,
  hire: Hire,
  department: Department2,
  actionType: 'auto' | 'manual',
  source: 'registration' | 'employee_list',
  personalInfo?: PersonalInfo,
  recipientEmail?: string
): Promise<{
  success: boolean;
  emailLogId?: string;
  webhookEventId?: string;
  error?: string;
}> {
  try {
    // 1. 이메일 로그 생성
    const emailLog = await logEmailSent(hire.id, emailType, 'pending');
    
    // 2. 웹훅 페이로드 생성
    const payload = createEmailPayload(
      emailType,
      hire,
      department,
      actionType,
      source,
      personalInfo,
      recipientEmail
    );
    
    // 3. 웹훅 발송
    const webhookResult = await sendWebhook(payload);
    
    // 4. 웹훅 이벤트 로그 생성
    const webhookEvent = await logWebhookEvent(
      hire.id,
      payload,
      webhookResult.status
    );
    
    // 5. 이메일 로그 상태 업데이트
    const finalStatus = webhookResult.success ? 'sent' : 'failed';
    await supabase
      .from('email_log')
      .update({ status: finalStatus })
      .eq('id', emailLog.id);
    
    return {
      success: webhookResult.success,
      emailLogId: emailLog.id,
      webhookEventId: webhookEvent.id,
      error: webhookResult.error,
    };
  } catch (error) {
    logger.error('이메일 발송 통합 에러', error, {
      module: 'EmailService',
      action: 'send-email-error',
      data: { emailType, hireName: hire.name }
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// 1. 입사예정자 이메일 자동 발송 (등록 시)
export async function sendNewHireEmail(
  hire: Hire,
  department: Department2,
  personalInfo?: PersonalInfo
) {
  logger.info('입사예정자 이메일 발송', {
    module: 'EmailService',
    action: 'send-new-hire-email',
    data: { hireName: hire.name, department: department.name }
  });
  return sendEmail(
    EMAIL_TYPES.NEW_HIRE, 
    hire, 
    department, 
    'auto', 
    'registration', 
    personalInfo, 
    hire.email || undefined
  );
}

// 2. 단체보험 담당자 이메일 발송
export async function sendInsuranceEmail(
  hire: Hire,
  department: Department2,
  personalInfo?: PersonalInfo,
  recipientEmail?: string
) {
  logger.info('단체보험 담당자 이메일 발송', {
    module: 'EmailService',
    action: 'send-insurance-email',
    data: { hireName: hire.name, recipientEmail }
  });
  return sendEmail(
    EMAIL_TYPES.INSURANCE, 
    hire, 
    department, 
    'manual', 
    'employee_list', 
    personalInfo, 
    recipientEmail
  );
}

// 3. 건강검진 담당자 이메일 발송
export async function sendHealthCheckEmail(
  hire: Hire,
  department: Department2,
  personalInfo?: PersonalInfo,
  recipientEmail?: string
) {
  logger.info('건강검진 담당자 이메일 발송', {
    module: 'EmailService',
    action: 'send-health-check-email',
    data: { hireName: hire.name, recipientEmail }
  });
  return sendEmail(
    EMAIL_TYPES.HEALTH_CHECK, 
    hire, 
    department, 
    'manual', 
    'employee_list', 
    personalInfo, 
    recipientEmail
  );
}

// 4. 유관부서 및 해당부서장 이메일 발송
export async function sendDepartmentEmail(
  hire: Hire,
  department: Department2,
  personalInfo?: PersonalInfo
) {
  logger.info('유관부서 및 해당부서장 이메일 발송', {
    module: 'EmailService',
    action: 'send-department-email',
    data: { hireName: hire.name, department: department.name }
  });
  return sendEmail(
    EMAIL_TYPES.DEPARTMENT, 
    hire, 
    department, 
    'manual', 
    'employee_list', 
    personalInfo, 
    department.manager_email
  );
}

// 이메일 발송 이력 조회 함수
export async function getEmailHistory(hireId: string) {
  try {
    const { data, error } = await supabase
      .from('email_log')
      .select('*')
      .eq('hire_id', hireId)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('이메일 이력 조회 에러', error, {
      module: 'EmailService',
      action: 'get-history-error',
      data: { hireId }
    });
    return [];
  }
} 