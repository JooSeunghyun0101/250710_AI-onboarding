/**
 * 공통 타입 정의
 */

// 로딩 상태 타입
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

// 폼 상태 타입
export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// 필터 타입
export interface FilterOptions {
  search?: string;
  department?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// 정렬 타입
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 테이블 헤더 타입
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// 통계 데이터 타입
export interface StatsData {
  totalHires: number;
  completedSelfEntry: number;
  emailsSent: number;
  completionRate: number;
}

// 부서 정보 타입 (확장)
export interface Department {
  id: number;
  name: string;
  managerName: string;
  managerEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

// 입사자 상태 타입
export type HireStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// 이메일 타입
export type EmailStatus = 'pending' | 'sent' | 'failed';

// 입사자 진행 상황 타입
export interface HireProgress {
  personalInfoCompleted: boolean;
  emailsSent: EmailStatus[];
  daysFromStart: number;
  overallProgress: number;
  status: HireStatus;
}

// 환경 변수 타입
export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  makeWebhookUrl: string;
  isDevelopment: boolean;
}

// 컴포넌트 Props 기본 타입
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 모달 Props 타입
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// 버튼 변형 타입
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// 토스트 타입
export type ToastVariant = 'default' | 'destructive';

export interface ToastMessage {
  title: string;
  description?: string;
  variant?: ToastVariant;
} 