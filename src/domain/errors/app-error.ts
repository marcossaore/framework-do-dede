export type AppErrorData = {
  message: string
  code?: string
  details?: Record<string, any>
}

export abstract class AppError extends Error {
  private readonly statusCode: number
  private readonly data?: AppErrorData

  constructor(message: string, statusCode: number, data?: AppErrorData) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.data = data
  }

  getStatusCode(): number {
    return this.statusCode
  }

  getData(): AppErrorData | undefined {
    return this.data
  }
}
