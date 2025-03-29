import HttpServer from "@/http/HttpServer"
import type { Controller } from "@/protocols/Controller"
import { Registry } from "@/di/registry"
import { HttpMiddleware, RequestData, RequestMetricsHandler } from "@/protocols"
import { ServerError } from "@/http"

type Input = {
    headers: any
    body: any
    params: any
    query: any
}

export type RequestMetrics = {
    startTime: number,
    elapsedTime: number,
    endTime: number,
    date: Date,
    method: string
    route: string, 
    agent: string,
    ip: string,
    contentLength: string,
    error?: { stack: string, originalMessage: string, message: string, statusCode: number }
    handler: {
        instance: string
        method: string
    }
}

export default class ControllerHandler {
    constructor(httpServer: HttpServer, port: number) {
        for (const { instance, instanceMethod, middlewares, method, route, statusCode, params, query, validation, offLogs, metricsHandlers  } of this.registryControllers()) {
            httpServer.register(
                {
                    method,
                    route,
                    statusCode,
                    params,
                    query
                },
                async (input: Input) => {
                    const requestMetrics: RequestMetrics = {
                        date: new Date(),
                        startTime: 0,
                        elapsedTime: 0,
                        endTime: 0,
                        method,
                        route,
                        agent: input.headers['user-agent'],
                        ip: input.headers['ip'],
                        contentLength: input.headers['content-length'],
                        handler: {
                            instance: instance.constructor.name,
                            method: instanceMethod
                        },
                    };
                    const logger = {
                        date: requestMetrics.date,
                        method: requestMetrics.method.toLocaleUpperCase(),
                        route: requestMetrics.route,
                        handler: requestMetrics.handler
                    } as any
                    if (!offLogs) console.log('\x1b[35m%s\x1b[0m', `🏳️  [LOG] Init: "${logger.handler.instance}.${logger.handler.method}:" - ${JSON.stringify(logger)}`)
                    requestMetrics.startTime = performance.now()
                    const filterParams = this.filter(input.params, params)
                    const queryParams = this.filter(input.query, query)
                    let mergedParams = { ...filterParams, ...queryParams, ...(input.body || {}) }
                    if (validation) mergedParams = validation.validate({ ...filterParams, ...queryParams, ...(input.body || {}) });
                    let middlewareData = {}
                    if (middlewares) {
                        for (const middleware of middlewares) {
                            const middlewareResult = await middleware.execute({ headers: input.headers, ...mergedParams })
                            middlewareData = { ...middlewareResult, ...middlewareData }
                        }
                    }
                    const request: RequestData = { headers: input.headers, data: mergedParams, middlewareData }
                    try {
                        const response = await instance[instanceMethod](mergedParams, request)
                        if (!offLogs) console.log('\x1b[32m%s\x1b[0m', `✅ [LOG] Finish: "${logger.handler.instance}.${logger.handler.method}:" - ${requestMetrics.elapsedTime}ms`)
                        return response
                    } catch (error: any) {
                        if (!offLogs) console.log('\x1b[31m%s\x1b[0m', `❌ [LOG] Erro: "${logger.handler.instance}.${logger.handler.method}:" - error: ${error.message}`)
                        requestMetrics.error = this.extractError(error)
                    } finally {
                        requestMetrics.endTime = performance.now();
                        requestMetrics.elapsedTime = requestMetrics.endTime - requestMetrics.startTime;

                        if (metricsHandlers?.length) {
                            await Promise.all(
                                metricsHandlers.map((handler: RequestMetricsHandler) => handler.handle(requestMetrics, request))
                            );
                        }
                    }
                }
            )
        }
        httpServer.listen(port)
    }

    private registryControllers() {
        const registryControllers = Registry.resolve<any[]>('controllers');
        const controllers: Controller[] = []
        for (const controller of registryControllers) {
            const basePath = Reflect.getMetadata('basePath', controller);
            const injections = Reflect.getMetadata('injections', controller) || [];
            const args = injections.map((token: string) => Registry.resolve(token))
            const instance = new controller(...args)
            const methodNames = Object.getOwnPropertyNames(controller.prototype).filter(method => method !== 'constructor')
            for (const methodName of methodNames) {
                const validation = Reflect.getMetadata('validation', controller.prototype, methodName);
                const routeConfig = Reflect.getMetadata('route', controller.prototype, methodName);
                const middlewares: Array<new (...args: any[]) => HttpMiddleware> = Reflect.getMetadata('middlewares', controller.prototype, methodName);
                const metricsHandlers: Array<new (...args: any[]) => RequestMetricsHandler> = Reflect.getMetadata('metricsHandlers', controller.prototype, methodName);
               const offConsoleLog = Reflect.getMetadata('offConsoleLog', controller.prototype, methodName) || false;
                controllers.push({
                    method: routeConfig.method,
                    route: basePath + routeConfig.path,
                    params: routeConfig.params,
                    query: routeConfig.query,
                    statusCode: routeConfig.statusCode,
                    instance,
                    instanceMethod: methodName,
                    middlewares: middlewares ? middlewares.map(middleware => Registry.classLoader(middleware)) : [],
                    validation,
                    metricsHandlers: metricsHandlers ? metricsHandlers.map(metricsHandler => Registry.classLoader(metricsHandler)) : [],
                    offLogs: offConsoleLog
                });
            }
        }
        return controllers
    }

    private filter(params: any, filterParams?: string[]): any {
        const filter: any = {}
        for (const paramName of filterParams || []) {
            const [paramNameFiltered, type] = paramName.split('|')
            let value = params[paramName] || params[paramNameFiltered]
            if (!value) return
            if (type === 'boolean') value = value === 'true'
            if (type === 'integer') {
                value = value.replace(/[^0-9]/g, '')
                value = value ? parseInt(value) : 0
            }
            if (type === 'string') value = value.toString()
            filter[paramNameFiltered] = value
        }
        return filter
    }

    private extractError(error: any): { stack: string, originalMessage: string, message: string, statusCode: number } {
        let statusCode: number
        if (error instanceof ServerError) statusCode = error.getStatusCode()
        else statusCode = 500
        return {
            stack: error.stack?.toString(),
            originalMessage: error.message,
            message: error.message,
            statusCode
        }
    }
}
