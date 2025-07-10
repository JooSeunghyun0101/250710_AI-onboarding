/**
 * 애플리케이션 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 필요한 경우만 로깅
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  action?: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const moduleInfo = context?.module ? `[${context.module}]` : '';
    const actionInfo = context?.action ? `{${context.action}}` : '';
    
    return `${timestamp} ${level.toUpperCase()} ${moduleInfo}${actionInfo} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context), context?.data || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context), context?.data || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context), context?.data || '');
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      ...(context?.data && typeof context.data === 'object' ? context.data as Record<string, unknown> : {}),
    };
    
    console.error(this.formatMessage('error', message, context), errorInfo);
  }

  // API 호출 로깅을 위한 특화된 메서드
  apiCall(method: string, endpoint: string, data?: unknown): void {
    this.debug(`API ${method} ${endpoint}`, {
      module: 'API',
      action: 'request',
      data,
    });
  }

  apiSuccess(method: string, endpoint: string, data?: unknown): void {
    this.debug(`API ${method} ${endpoint} - Success`, {
      module: 'API',
      action: 'response',
      data,
    });
  }

  apiError(method: string, endpoint: string, error: unknown): void {
    this.error(`API ${method} ${endpoint} - Failed`, error, {
      module: 'API',
      action: 'error',
    });
  }
}

export const logger = new Logger(); 