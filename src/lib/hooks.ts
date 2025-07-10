'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  hireApi, 
  personalInfoApi, 
  departmentApi, 
  department2Api,
  emailLogApi, 
  webhookEventApi, 
  statsApi,
  recentActivityApi,
  type HireInsert,
  type PersonalInfoInsert
} from './api';

// Query Keys
export const queryKeys = {
  hires: ['hires'] as const,
  hire: (id: string) => ['hires', id] as const,
  personalInfo: (hireId: string) => ['personal-info', hireId] as const,
  departments: ['departments'] as const,
  departments2: ['departments2'] as const,
  emailLogs: (hireId: string) => ['email-logs', hireId] as const,
  webhookEvents: (hireId: string) => ['webhook-events', hireId] as const,
  stats: ['stats'] as const,
  recentActivities: ['recent-activities'] as const,
};

// Hire hooks
export const useHires = () => {
  return useQuery({
    queryKey: queryKeys.hires,
    queryFn: () => hireApi.getAll(),
    retry: 3,
    staleTime: 1 * 60 * 1000, // 1분 (짧게 설정하여 더 자주 최신 데이터 가져오기)
    refetchOnWindowFocus: true, // 창 포커스 시 자동 refetch
    refetchOnMount: true, // 컴포넌트 마운트 시 자동 refetch
  });
};

export const useHire = (id: string) => {
  return useQuery({
    queryKey: queryKeys.hire(id),
    queryFn: () => hireApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateHire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (hire: HireInsert) => hireApi.create(hire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hires });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

export const useUpdateHire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HireInsert> }) => 
      hireApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hires });
      queryClient.invalidateQueries({ queryKey: queryKeys.hire(data.id) });
    },
  });
};

export const useDeleteHire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => hireApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hires });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
};

// PersonalInfo hooks
export const usePersonalInfo = (hireId: string) => {
  return useQuery({
    queryKey: queryKeys.personalInfo(hireId),
    queryFn: () => personalInfoApi.getByHireId(hireId),
    enabled: !!hireId,
  });
};

export const useUpsertPersonalInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (personalInfo: PersonalInfoInsert) => 
      personalInfoApi.upsert(personalInfo),
    onSuccess: (data) => {
      // 모든 관련 쿼리 캐시를 무효화하여 최신 데이터 반영
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.personalInfo(data.hire_id) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.hires });
      queryClient.invalidateQueries({ queryKey: queryKeys.hire(data.hire_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      
      // 강제로 데이터 refetch
      queryClient.refetchQueries({ queryKey: queryKeys.hires });
    },
  });
};

// Department hooks
export const useDepartments = () => {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => departmentApi.getAll(),
  });
};

// Department2 hooks
export const useDepartments2 = () => {
  return useQuery({
    queryKey: queryKeys.departments2,
    queryFn: () => department2Api.getAll(),
  });
};

export const useDepartment2ByName = (name: string) => {
  return useQuery({
    queryKey: ['department2', name],
    queryFn: () => department2Api.getByName(name),
    enabled: !!name,
  });
};

// EmailLog hooks
export const useEmailLogs = (hireId: string) => {
  return useQuery({
    queryKey: queryKeys.emailLogs(hireId),
    queryFn: () => emailLogApi.getByHireId(hireId),
    enabled: !!hireId,
  });
};

// WebhookEvent hooks
export const useWebhookEvents = (hireId: string) => {
  return useQuery({
    queryKey: queryKeys.webhookEvents(hireId),
    queryFn: () => webhookEventApi.getByHireId(hireId),
    enabled: !!hireId,
  });
};

// Stats hooks
export const useStats = () => {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => statsApi.getOverview(),
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// Recent Activities hooks
export const useRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.recentActivities, limit],
    queryFn: () => recentActivityApi.getRecentActivities(limit),
    retry: 3,
    staleTime: 1 * 60 * 1000, // 1분 (짧게 설정하여 더 자주 최신 데이터 가져오기)
    refetchOnWindowFocus: true, // 창 포커스 시 자동 refetch
    refetchOnMount: true, // 컴포넌트 마운트 시 자동 refetch
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 refetch
  });
}; 