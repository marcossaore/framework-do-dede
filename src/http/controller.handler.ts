import HttpServer, { HttpServerParams, Request } from "@/http/http-server"
import { InternalServerError, ServerError } from "@/http"
import { flushControllers, getControllers, Middleware, Tracer } from "../application/controller"

type Input = {
    headers: any
    body: any
    params: any
    query: any
    setStatus: (statusCode: number) => void
}

export default class ControllerHandler {
    constructor(httpServer: HttpServer, port: number) {
        for (const { handler, middlewares, method, route, statusCode, params, query, headers, responseType } of this.registryControllers()) {
            httpServer.register(
                {
                    method,
                    route,
                    handler,
                    statusCode,
                    params,
                    query,
                    headers,
                    middlewares,
                    responseType
                },
                async (input: Input) => {
                    let requestedAt = new Date();
                    let startTime = 0;
                    let endTime = 0;
                    let mergedParams;
                    let request: Request;
                    let capturedError;
                    let middlewaresExecuted: { elapsedTime: string, middleware: string, error?: any }[] = [];
                    try {
                        startTime = performance.now()
                        const filterParams = this.filter(input.params, params)
                        const filterQueryParams = this.filter(input.query, query)
                        const filterHeaders = this.filter(input.headers, headers)
                        mergedParams = {...filterHeaders, ...filterParams, ...filterQueryParams, ...(input.body || {}) }
                        request = { data: mergedParams, context: {} }
                        middlewaresExecuted = await this.executeMiddlewares(middlewares, request)
                        const response = await handler.instance[handler.methodName](request)
                        endTime = performance.now()
                        return response
                    } catch (error: any) {
                        capturedError = this.extractError(error, httpServer);
                        input.setStatus(capturedError.statusCode)
                        endTime = performance.now()
                        return {
                            message: capturedError.message,
                            statusCode: capturedError.statusCode
                        };
                    } finally {
                        if (handler.tracer) {
                            const elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;
                            const controllerData = {
                                requestedAt,
                                elapsedTime,
                                route,
                                method,
                                middlewares: middlewaresExecuted,
                                error: capturedError,
                                headers: input.headers
                            }
                            await handler.tracer.trace(controllerData)
                        }
                    }
                }
            )
        }
        httpServer.listen(port)
    }

    private async executeMiddlewares(middlewares: Middleware[] = [], request: Request): Promise<{ elapsedTime: string, middleware: string, error?: any }[]> {
        const executed: { elapsedTime: string, middleware: string, error?: any }[] = [];
        if (middlewares && middlewares.length > 0) {
            for (const middleware of middlewares) {
                let startTime = 0;
                let endTime = 0;
                let elapsedTime;
                try {
                    startTime = performance.now()
                    const middlewareResult = await middleware.execute(request)
                    request.context = Object.assign(request.context, middlewareResult)
                    endTime = performance.now()
                    elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;
                    executed.push({
                        elapsedTime,
                        middleware: middleware.constructor.name
                    })
                } catch (error) {
                    elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;
                    executed.push({
                        elapsedTime,
                        middleware: middleware.constructor.name,
                        error
                    })
                    throw error;
                }
            }
        }
        return executed;
    }

    private registryControllers(): HttpServerParams[] {
        const controllers: HttpServerParams[] = [] ;
        for (const controller of getControllers()) {
            const basePath = Reflect.getMetadata('basePath', controller);
            const methodNames = Object.getOwnPropertyNames(controller.prototype).filter(method => method !== 'constructor')
            let tracer = Reflect.getMetadata('tracer', controller) || null;
            const instance = new controller();
            for (const methodName of methodNames) {
                const routeConfig = Reflect.getMetadata('route', controller.prototype, methodName);
                const middlewares: Array<new (...args: any[]) => Middleware> = Reflect.getMetadata('middlewares', controller.prototype, methodName);
                const responseType = Reflect.getMetadata('responseType', controller.prototype, methodName) || 'json';
                tracer = Reflect.getMetadata('tracer', controller.prototype, methodName) || tracer as Tracer<void>;
                controllers.push({
                    method: routeConfig.method,
                    route: basePath + routeConfig.path,
                    params: routeConfig.params,
                    query: routeConfig.query,
                    headers: routeConfig.headers,
                    statusCode: routeConfig.statusCode,
                    handler: {
                        instance,
                        methodName,
                        tracer
                    },
                    responseType,
                    middlewares: middlewares ? middlewares.map(middleware => new middleware()) : [],
                });
            }
        }
        flushControllers()
        return controllers
    }

    private filter(params: any, filterParams?: string[]): any {
        const filter: any = {}
        for (const paramName of filterParams || []) {
            const [paramNameFiltered, type] = paramName.split('|')
            let value = params[paramName] || params[paramNameFiltered]
            if (!value) continue
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
