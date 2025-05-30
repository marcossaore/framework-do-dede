import type { AllowedMethods, HttpStatusCode } from "@/http/HttpServer"
import type { HttpMiddleware } from "./HttpMiddleware"
import { RequestMetricsHandler } from "./RequestMetricsHandler"

export type Controller = {
    instance: any
    instanceMethod: string
    route: string
    method: AllowedMethods
    middlewares?: HttpMiddleware[]
    statusCode?: HttpStatusCode
    params?: any
    query?: any
    metricsHandlers?: RequestMetricsHandler[]
    offLogs?: boolean
}