import { logger } from './logger';

/**
 * 에러 타입 정의
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API = 'API',
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 앱 에러 클래스
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    userMessage: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.userMessage = userMessage;
    this.context = context;
  }
}

/**
 * 에러 생성 팩토리 함수들
 */
export const createError = {
  validation: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.VALIDATION, code, message, userMessage, context),

  api: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.API, code, message, userMessage, context),

  network: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.NETWORK, code, message, userMessage, context),

  auth: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.AUTH, code, message, userMessage, context),

  permission: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.PERMISSION, code, message, userMessage, context),

  notFound: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.NOT_FOUND, code, message, userMessage, context),

  unknown: (code: string, message: string, userMessage: string, context?: Record<string, unknown>) =>
    new AppError(ErrorType.UNKNOWN, code, message, userMessage, context),
};

/**
 * 에러 처리 결과 타입
 */
export interface ErrorHandlingResult {
  success: false;
  error: AppError;
  userMessage: string;
}

export interface SuccessResult<T = unknown> {
  success: true;
  data: T;
}

export type Result<T = unknown> = SuccessResult<T> | ErrorHandlingResult;

/**
 * 에러를 표준화하여 처리하는 함수
 */
export function handleError(
  error: unknown,
  module: string,
  action: string,
  context?: Record<string, unknown>
): ErrorHandlingResult {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // 일반 Error 객체를 AppError로 변환
    appError = createError.unknown(
      'UNKNOWN_ERROR',
      error.message,
      '예상치 못한 오류가 발생했습니다.',
      { originalError: error.name, ...context }
    );
  } else {
    // 알 수 없는 타입의 에러
    appError = createError.unknown(
      'UNKNOWN_ERROR',
      String(error),
      '알 수 없는 오류가 발생했습니다.',
      { originalError: error, ...context }
    );
  }

  // 에러 로깅
  logger.error(`${module}/${action} 에러 발생`, appError, {
    module,
    action,
    data: {
      type: appError.type,
      code: appError.code,
      userMessage: appError.userMessage,
      context: appError.context,
    },
  });

  return {
    success: false,
    error: appError,
    userMessage: appError.userMessage,
  };
}

/**
 * 성공 결과를 생성하는 헬퍼 함수
 */
export function createSuccess<T>(data: T): SuccessResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 비동기 함수를 안전하게 실행하는 래퍼
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  module: string,
  action: string,
  context?: Record<string, unknown>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return createSuccess(data);
  } catch (error) {
    return handleError(error, module, action, context);
  }
}

/**
 * Supabase 에러를 AppError로 변환하는 함수
 */
export function handleSupabaseError(
  error: any,
  userMessage: string = '데이터베이스 작업 중 오류가 발생했습니다.'
): AppError {
  const code = error?.code || 'SUPABASE_ERROR';
  const message = error?.message || 'Unknown Supabase error';

  // Supabase 에러 코드에 따른 분류
  if (code === 'PGRST116') {
    return createError.notFound('NOT_FOUND', message, '요청한 데이터를 찾을 수 없습니다.');
  }

  if (code.startsWith('PGRST1')) {
    return createError.api('SUPABASE_API_ERROR', message, userMessage);
  }

  if (code.startsWith('42')) {
    return createError.permission('SUPABASE_PERMISSION_ERROR', message, '권한이 없습니다.');
  }

  return createError.api('SUPABASE_ERROR', message, userMessage);
} 