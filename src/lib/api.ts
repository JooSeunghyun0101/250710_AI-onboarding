'use client';

import { supabase } from './supabase';
import { logger } from './logger';
import { handleSupabaseError, safeExecute, type Result } from './error-handler';
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

// 타입 정의
export type Hire = Tables<'hire'>;
export type PersonalInfo = Tables<'personal_info'>;
export type Department = Tables<'department'>;
export type Department2 = Tables<'department2'>;
export type EmailLog = Tables<'email_log'>;
export type WebhookEvent = Tables<'webhook_event'>;

export type HireInsert = TablesInsert<'hire'>;
export type PersonalInfoInsert = TablesInsert<'personal_info'>;

// Hire 관련 API
export const hireApi = {
  // 모든 입사자 조회 (soft delete 제외)
  async getAll(): Promise<Hire[]> {
    const result = await safeExecute(
      async () => {
        const { data, error } = await supabase
          .from('hire')
          .select(`
            *,
            personal_info (*)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw handleSupabaseError(error, '입사자 목록을 불러오는데 실패했습니다.');
        }
        
        return data || [];
      },
      'hireApi',
      'getAll'
    );

    // 에러 발생 시 빈 배열 반환하여 앱이 멈추지 않도록 함
    return result.success ? result.data : [];
  },

  // 특정 입사자 조회
  async getById(id: string): Promise<Hire | null> {
    const result = await safeExecute(
      async () => {
        const { data, error } = await supabase
          .from('hire')
          .select(`
            *,
            personal_info (*),
            email_log (*),
            webhook_event (*)
          `)
          .eq('id', id)
          .is('deleted_at', null)
          .single();
        
        if (error) {
          throw handleSupabaseError(error, '입사자 정보를 불러오는데 실패했습니다.');
        }
        
        return data;
      },
      'hireApi',
      'getById',
      { id }
    );

    return result.success ? result.data : null;
  },

  // 신규 입사자 등록
  async create(hire: HireInsert) {
    const { data, error } = await supabase
      .from('hire')
      .insert(hire)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 입사자 정보 수정
  async update(id: string, updates: TablesUpdate<'hire'>) {
    const { data, error } = await supabase
      .from('hire')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 입사자 삭제 (soft delete)
  async delete(id: string) {
    const { data, error } = await supabase
      .from('hire')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// PersonalInfo 관련 API
export const personalInfoApi = {
  // 자기기입 정보 조회
  async getByHireId(hireId: string) {
    const { data, error } = await supabase
      .from('personal_info')
      .select('*')
      .eq('hire_id', hireId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: not found
    return data;
  },

  // 자기기입 정보 생성 또는 업데이트
  async upsert(personalInfo: PersonalInfoInsert) {
    const { data, error } = await supabase
      .from('personal_info')
      .upsert(personalInfo, { onConflict: 'hire_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Department 관련 API
export const departmentApi = {
  // 모든 부서 조회
  async getAll() {
    const { data, error } = await supabase
      .from('department')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }
};

// Department2 관련 API
export const department2Api = {
  // 모든 부서 조회
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('department2')
        .select('*')
        .order('name');
      
      if (error) {
        logger.apiError('GET', 'department2', error);
        throw error;
      }
      
      logger.apiSuccess('GET', 'department2', data);
      return data;
    } catch (err) {
      logger.apiError('GET', 'department2', err);
      throw err;
    }
  },

  // 특정 부서 조회
  async getById(id: number) {
    const { data, error } = await supabase
      .from('department2')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // 부서명으로 조회
  async getByName(name: string) {
    try {
      logger.apiCall('GET', `department2/${name}`, { name });
      const { data, error } = await supabase
        .from('department2')
        .select('*')
        .eq('name', name)
        .single();
      
      if (error) {
        logger.apiError('GET', `department2/${name}`, error);
        throw error;
      }
      
      logger.apiSuccess('GET', `department2/${name}`, data);
      return data;
    } catch (err) {
      logger.apiError('GET', `department2/${name}`, err);
      throw err;
    }
  }
};

// EmailLog 관련 API
export const emailLogApi = {
  // 이메일 로그 생성
  async create(emailLog: TablesInsert<'email_log'>) {
    const { data, error } = await supabase
      .from('email_log')
      .insert(emailLog)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 특정 입사자의 이메일 로그 조회
  async getByHireId(hireId: string) {
    const { data, error } = await supabase
      .from('email_log')
      .select('*')
      .eq('hire_id', hireId)
      .order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// WebhookEvent 관련 API
export const webhookEventApi = {
  // 웹훅 이벤트 생성
  async create(webhookEvent: TablesInsert<'webhook_event'>) {
    const { data, error } = await supabase
      .from('webhook_event')
      .insert(webhookEvent)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 특정 입사자의 웹훅 이벤트 조회
  async getByHireId(hireId: string) {
    const { data, error } = await supabase
      .from('webhook_event')
      .select('*')
      .eq('hire_id', hireId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// 통계 관련 API
export const statsApi = {
  // 전체 통계 조회
  async getOverview() {
    try {
      // 모든 API 호출을 병렬로 실행하여 성능 개선
      const [hiresResult, personalInfoResult, emailResult] = await Promise.allSettled([
        // 전체 입사자 수
        supabase
          .from('hire')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        
        // 자기기입 완료 수
        supabase
          .from('personal_info')
          .select('*', { count: 'exact', head: true }),
        
        // 이메일 발송 현황
        supabase
          .from('email_log')
          .select('status')
          .eq('status', 'success')
      ]);

      // 결과 처리 - 실패한 호출은 기본값 사용
      const totalHires = hiresResult.status === 'fulfilled' ? (hiresResult.value.count || 0) : 0;
      const completedSelfEntry = personalInfoResult.status === 'fulfilled' ? (personalInfoResult.value.count || 0) : 0;
      const emailsSent = emailResult.status === 'fulfilled' ? (emailResult.value.data?.length || 0) : 0;

      return {
        totalHires,
        completedSelfEntry,
        emailsSent,
        completionRate: totalHires ? Math.round(completedSelfEntry / totalHires * 100) : 0
      };
    } catch (error) {
      console.error('통계 조회 중 에러 발생:', error);
      // 에러 발생 시 기본값 반환
      return {
        totalHires: 0,
        completedSelfEntry: 0,
        emailsSent: 0,
        completionRate: 0
      };
    }
  }
};

// 최근 활동 타입 정의
export interface RecentActivity {
  id: string;
  type: 'new_hire' | 'personal_info' | 'email_sent' | 'email_failed';
  title: string;
  description: string;
  time: string;
  hire_name: string;
  hire_id: string;
}

// 최근 활동 관련 API
export const recentActivityApi = {
  // 최근 활동 목록 조회 (최근 20개)
  async getRecentActivities(limit: number = 20): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // 1. 최근 입사자 등록 (최근 7일)
      const { data: recentHires } = await supabase
        .from('hire')
        .select('id, name, created_at, department')
        .is('deleted_at', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentHires) {
        recentHires.forEach(hire => {
          activities.push({
            id: `hire_${hire.id}`,
            type: 'new_hire',
            title: '신규 입사자 등록',
            description: `${hire.name}님이 ${hire.department}부서에 등록되었습니다.`,
            time: hire.created_at,
            hire_name: hire.name,
            hire_id: hire.id
          });
        });
      }

      // 2. 최근 자기기입 정보 제출 (최근 7일)
      const { data: recentPersonalInfo } = await supabase
        .from('personal_info')
        .select(`
          hire_id,
          created_at,
          hire!inner(name, department)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentPersonalInfo) {
        recentPersonalInfo.forEach(info => {
          const hire = info.hire as any;
          activities.push({
            id: `personal_${info.hire_id}`,
            type: 'personal_info',
            title: '자기기입 정보 제출',
            description: `${hire.name}님이 개인정보 입력을 완료했습니다.`,
            time: info.created_at,
            hire_name: hire.name,
            hire_id: info.hire_id
          });
        });
      }

      // 3. 최근 이메일 발송 이력 (최근 3일)
      const { data: recentEmails } = await supabase
        .from('email_log')
        .select(`
          id,
          email_type,
          status,
          sent_at,
          hire_id,
          hire!inner(name, department)
        `)
        .gte('sent_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false })
        .limit(15);

      if (recentEmails) {
        const emailTypeLabels = {
          'new_hire': '신규 입사자 환영',
          'insurance': '단체보험 담당자',
          'health_check': '건강검진 담당자', 
          'department': '유관부서 알림',
          'department_notification': '부서 알림',
          'welcome_guide': '출근 안내'
        } as const;

        recentEmails.forEach(email => {
          const hire = email.hire as any;
          const emailLabel = emailTypeLabels[email.email_type as keyof typeof emailTypeLabels] || email.email_type;
          
          activities.push({
            id: `email_${email.id}`,
            type: email.status === 'success' ? 'email_sent' : 'email_failed',
            title: email.status === 'success' ? '이메일 발송 완료' : '이메일 발송 실패',
            description: `${hire.name}님에게 ${emailLabel} 이메일이 ${email.status === 'success' ? '발송되었습니다' : '발송 실패했습니다'}.`,
            time: email.sent_at,
            hire_name: hire.name,
            hire_id: email.hire_id
          });
        });
      }

      // 시간 순으로 정렬하고 제한된 개수만 반환
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

    } catch (error) {
      logger.error('최근 활동 조회 중 에러 발생', error, {
        module: 'recentActivityApi',
        action: 'getRecentActivities'
      });
      return [];
    }
  }
}; 