export type RequestMetrics = {
    elapsedTime: string,
    date: Date,
    method: string
    route: string, 
    agent: string,
    ip: string,
    contentLength: string,
    error?: { message: string, statusCode: number, unexpectedError?: string }
    handler: {
        instance: string
        method: string
    }
}