import { AppError } from './app-error'

export class BadRequest extends AppError {
  constructor(message: string, data?: { code?: string; details?: Record<string, any> }) {
    super(message, 400, data ? { message, ...data } : undefined)
  }
}

export class Unauthorized extends AppError {
  constructor(message: string, data?: { code?: string; details?: Record<string, any> }) {
    super(message, 401, data ? { message, ...data } : undefined)
  }
}

export class Forbidden extends AppError {
  constructor(message: string, data?: { code?: string; details?: Record<string, any> }) {
    super(message, 403, data ? { message, ...data } : undefined)
  }
}

export class NotFound extends AppError {
  constructor(message: string, data?: { code?: string; details?: Record<string, any> }) {
    super(message, 404, data ? { message, ...data } : undefined)
  }
}

export class Conflict extends AppError {
  constructor(message: string, data?: { code?: string; details?: Record<string, any> }) {
    super(message, 409, data ? { message, ...data } : undefined)
  }
}

export class UnprocessableEntity extends AppError {
  constructor(message: string, data?: { code?: string; details?: Record<string, any> }) {
    super(message, 422, data ? { message, ...data } : undefined)
  }
}

export class InternalServerError extends AppError {
  private readonly unexpectedError: string

  constructor(unexpectedError: string, defaultMessage: string = 'Ops, An unexpected error occurred') {
    super(defaultMessage, 500, { message: defaultMessage })
    this.unexpectedError = unexpectedError
  }

  getUnexpectedError(): string {
    return this.unexpectedError
  }
}
