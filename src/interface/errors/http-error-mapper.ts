import { AppError } from '@/domain/errors/app-error'
import { InternalServerError } from '@/domain/errors/http-errors'
import type HttpServer from '@/http/http-server'

export type MappedError = {
  message: string
  statusCode: number
  custom?: boolean
  unexpectedError?: string
}

export class HttpErrorMapper {
  map(error: any, httpServer: HttpServer): MappedError {
    if (error instanceof AppError) {
      return {
        message: error.message,
        statusCode: error.getStatusCode()
      }
    }

    if (error && typeof error.getStatusCode === 'function' && typeof error.getCustom === 'function') {
      return {
        ...error.getCustom(),
        statusCode: error.getStatusCode(),
        custom: true
      }
    }

    const debugError = {
      sourceUrl: error?.sourceURL,
      line: error?.line,
      column: error?.column,
    }

    const internal = new InternalServerError(error?.message || 'Unexpected error', httpServer.getDefaultMessageError())
    return {
      message: internal.message,
      statusCode: internal.getStatusCode(),
      unexpectedError: internal.getUnexpectedError(),
      ...debugError
    }
  }
}
