import HttpServer from "@/http/HttpServer"
import type { Controller } from "@/protocols/Controller"
import { Registry } from "@/di/registry"
import { HttpMiddleware, RequestData, RequestMetrics, RequestMetricsHandler } from "@/protocols"
import { InternalServerError, ServerError } from "@/http"
import { Log } from "@/utils/Log"

type Input = {
    headers: any
    body: any
    params: any
    query: any
    setStatus: (statusCode: number) => void
}

export default class ControllerHandler {
    constructor(httpServer: HttpServer, port: number) {
        for (const { instance, instanceMethod, middlewares, method, route, statusCode, params, query, validation, offLogs, metricsHandlers } of this.registryControllers()) {
            httpServer.register(
                {
                    method,
                    route,
                    statusCode,
                    params,
                    query,
                },
                async (input: Input) => {
                    let wasError = false;
                    const startTime = performance.now()
                    const requestMetrics: RequestMetrics = {
                        date: new Date(),
                        elapsedTime: '0 ms',
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
                    if (!offLogs) {
                        Log.info(`🏳️  [LOG] Init: "${logger.handler.instance}.${logger.handler.method}"`)
                        Log.info(JSON.stringify(logger))
                    }
                    const filterParams = this.filter(input.params, params)
                    const queryParams = this.filter(input.query, query)
                    let mergedParams = { ...filterParams, ...queryParams, ...(input.body || {}) }
                    const request: RequestData = { headers: input.headers, data: mergedParams, middlewareData: {} }
                    try {
                        if (validation) {
                            if (!offLogs) Log.info(`⏳  [LOG] Executing validations`)
                            mergedParams = validation.validate({ ...filterParams, ...queryParams, ...(input.body || {}) });
                        }
                    } catch (error: any) {
                        const capturedError = this.extractError(error, httpServer);
                        requestMetrics.error = capturedError;
                        input.setStatus(capturedError.statusCode);
                        const endTime = performance.now();
                        if (!offLogs) {
                            Log.error(`❌ [LOG] Error validations: "${logger.handler.instance}.${logger.handler.method}"` + ` - in: ${(endTime - startTime).toFixed(2)} ms`)
                            Log.error(JSON.stringify(this.transformErrorOnJSON(error)))
                        }
                        wasError = true
                        return {
                            message: capturedError.message,
                            statusCode: capturedError.statusCode
                        };
                    } finally {
                        if (wasError) {
                            const endTime = performance.now();
                            requestMetrics.elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;

                            if (metricsHandlers?.length) {
                                await Promise.all(
                                    metricsHandlers.map((handler: RequestMetricsHandler) => handler.handle(requestMetrics, request))
                                );
                            }
                        }
                    }
                    let middlewareData = {}
                    if (middlewares) {
                        if (!offLogs) Log.info(`⏳  [LOG] Executing middlewares`)
                        let count = 0;
                        for (const middleware of middlewares) {
                            try {
                                const endTime = performance.now()
                                const middlewareResult = await middleware.execute({ headers: input.headers, ...mergedParams })
                                Log.info(` ${++count} - middleware : ${(endTime - startTime).toFixed(2)} ms`)
                                middlewareData = { ...middlewareResult, ...middlewareData }
                            } catch (error) {
                                wasError = true
                                const capturedError = this.extractError(error, httpServer);
                                requestMetrics.error = capturedError;
                                input.setStatus(capturedError.statusCode)
                                const endTime = performance.now()
                                if (!offLogs) {
                                    Log.error(`❌ [LOG] Error middleware: "${logger.handler.instance}.${logger.handler.method}"` + ` - in: ${(endTime - startTime).toFixed(2)} ms`)
                                    Log.error(JSON.stringify(this.transformErrorOnJSON(error)))
                                }
                                return {
                                    message: capturedError.message,
                                    statusCode: capturedError.statusCode
                                };
                            } finally {
                                if (wasError) {
                                    const endTime = performance.now();
                                    requestMetrics.elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;

                                    if (metricsHandlers?.length) {
                                        await Promise.all(
                                            metricsHandlers.map((handler: RequestMetricsHandler) => handler.handle(requestMetrics, request))
                                        );
                                    }
                                }
                            }
                        }
                    }
                    if (middlewareData) request.middlewareData = middlewareData
                    try {
                        const response = await instance[instanceMethod](mergedParams, request)
                        if (!offLogs) {
                            const endTime = performance.now()
                            Log.success(`✅ [LOG] Finish: "${logger.handler.instance}.${logger.handler.method}" - in: ${(endTime - startTime).toFixed(2)} ms`)
                        }
                        return response
                    } catch (error: any) {
                        const capturedError = this.extractError(error, httpServer);
                        requestMetrics.error = capturedError;
                        input.setStatus(capturedError.statusCode)
                        if (!offLogs) {
                            const endTime = performance.now()
                            Log.error(`❌ [LOG] Error: "${logger.handler.instance}.${logger.handler.method}"` + ` - in: ${(endTime - startTime).toFixed(2)} ms`)
                            Log.error(JSON.stringify(this.transformErrorOnJSON(error)))
                        }
                        return {
                            message: capturedError.message,
                            statusCode: capturedError.statusCode
                        };
                    } finally {
                        const endTime = performance.now();
                        requestMetrics.elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;

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

    private transformErrorOnJSON (error: any) {
        return error instanceof ServerError ? error : { message: error.message, stack: error.stack }
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

    private extractError(error: any, httpServer: HttpServer): { unexpectedError?: string, message: string, statusCode: number } {
        if (error instanceof ServerError) {
            return {
                message: error.message,
                statusCode: error.getStatusCode()
            }
        }
        error = new InternalServerError(error.message, httpServer.getDefaultMessageError())
        return {
            message: error.message,
            statusCode: error.getStatusCode(),
            unexpectedError: error instanceof InternalServerError ? error.getUnexpectedError() : undefined,
        }
    }
}
