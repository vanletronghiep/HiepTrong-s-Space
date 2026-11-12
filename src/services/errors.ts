const APP_ERROR_BRAND = Symbol.for('hiep-trong-space.AppError');

export type AppErrorCode =
  'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'NOT_IMPLEMENTED' | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly [APP_ERROR_BRAND] = true;
  public readonly code: AppErrorCode;
  public readonly httpStatus: number;
  public readonly fields?: Record<string, string>;

  constructor(options: {
    code: AppErrorCode;
    message: string;
    httpStatus: number;
    fields?: Record<string, string>;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.fields = options.fields;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super({ code: 'VALIDATION_ERROR', message, httpStatus: 400, fields });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super({ code: 'NOT_FOUND', message, httpStatus: 404 });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super({ code: 'CONFLICT', message, httpStatus: 409 });
    this.name = 'ConflictError';
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string) {
    super({ code: 'NOT_IMPLEMENTED', message, httpStatus: 501 });
    this.name = 'NotImplementedError';
  }
}

/** Next instrumentation and route bundles may load distinct class instances. */
export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && error !== null && APP_ERROR_BRAND in error && error[APP_ERROR_BRAND] === true;
}
