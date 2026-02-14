import HttpServer, { HttpServerParams, Request } from "@/http/http-server"
import { Middleware, MiddlewareDefinition, Tracer } from "../application/controller"
import type { ValidatorDefinition, ValidatorLike } from "@/interface/validation/validator"
import { FrameworkError } from "@/http/errors/framework"
import { HttpRequestMapper } from "@/interface/http/request-mapper"
import { MiddlewareExecutor } from "@/interface/http/middleware-executor"
import { HttpErrorMapper } from "@/interface/errors/http-error-mapper"
import { validateWithClassValidator } from "@/interface/validation/class-validator"

type Input = {
    headers: any
    body: any
    params: any
    query: any
    setStatus: (statusCode: number) => void
}

export default class ControllerHandler {
    private readonly requestMapper = new HttpRequestMapper();
    private readonly middlewareExecutor = new MiddlewareExecutor();
    private readonly errorMapper = new HttpErrorMapper();
    private readonly prefix?: string;
    private readonly version?: number;

    constructor(
        httpServer: HttpServer,
        controllers: any[] = [],
        options: { prefix?: string, version?: number } = {}
    ) {
        this.prefix = options.prefix;
        this.version = options.version;
        for (const { handler, middlewares, validator, method, route, statusCode, params, query, headers, body, bodyFilter, responseType } of this.registryControllers(controllers)) {
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
                    validator,
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
                        request = this.requestMapper.map(input, { params, query, headers, body, bodyFilter })
                        if (validator) {
                            let validatorLike: ValidatorLike
                            let options
                            if (isValidatorDefinition(validator)) {
                                validatorLike = validator.validator
                                options = validator.error
                            } else {
                                validatorLike = validator as ValidatorLike
                            }

                            if (typeof validatorLike === 'function') {
                                request.data = await validateWithClassValidator(
                                    validatorLike,
                                    request.data,
                                    options
                                )
                            } else if (typeof validatorLike.validate === 'function') {
                                await validatorLike.validate(request.data)
                            } else {
                                throw new FrameworkError('Validator must be a class or implement validate()')
                            }
                        }
                        mergedParams = request.data
                        middlewaresExecuted = await this.middlewareExecutor.execute(middlewares, request)
                        const response = await handler.instance[handler.methodName](request)
                        endTime = performance.now()
                        return response
                    } catch (error: any) {
                        capturedError = this.errorMapper.map(error, httpServer);
                        input.setStatus(capturedError.statusCode)
                        endTime = performance.now()
                        if (capturedError?.custom) {
                            const removingCustom = { ...capturedError, custom: undefined }
                            return removingCustom
                        }
                        return {
                            error: capturedError.message,
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
    }

    private registryControllers(controllersList: any[]): HttpServerParams[] {
        const controllers: HttpServerParams[] = [];
        for (const controller of controllersList) {
            const basePath = Reflect.getMetadata('basePath', controller);
            const methodNames = Object.getOwnPropertyNames(controller.prototype).filter(method => method !== 'constructor')
            let tracer = Reflect.getMetadata('tracer', controller) || null;
            const controllerVersion = Reflect.getMetadata('version', controller);
            const controllerPresetIgnore = Reflect.getMetadata('presetIgnore', controller) as { prefix: boolean, version: boolean } | undefined;
            const instance = new controller();
            for (const methodName of methodNames) {
                const routeConfig = Reflect.getMetadata('route', controller.prototype, methodName);
                const middlewares: MiddlewareDefinition[] = Reflect.getMetadata('middlewares', controller.prototype, methodName);
                const responseType = Reflect.getMetadata('responseType', controller.prototype, methodName) || 'json';
                tracer = Reflect.getMetadata('tracer', controller.prototype, methodName) || tracer as Tracer<void>;
                const methodVersion = Reflect.getMetadata('version', controller.prototype, methodName);
                const methodPresetIgnore = Reflect.getMetadata('presetIgnore', controller.prototype, methodName) as { prefix: boolean, version: boolean } | undefined;
                const presetIgnore = methodPresetIgnore ?? controllerPresetIgnore;
                const ignoreGlobalVersion = presetIgnore?.version === true;
                const ignoreGlobalPrefix = presetIgnore?.prefix === true;
                const resolvedVersion = methodVersion ?? controllerVersion ?? (ignoreGlobalVersion ? undefined : this.version);
                const resolvedPrefix = ignoreGlobalPrefix ? undefined : this.prefix;
                const route = this.buildRoute(basePath + routeConfig.path, resolvedVersion, resolvedPrefix);
                controllers.push({
                    method: routeConfig.method,
                    route,
                    params: routeConfig.params,
                    query: routeConfig.query,
                    headers: routeConfig.headers,
                    body: routeConfig.body,
                    bodyFilter: routeConfig.bodyFilter,
                    statusCode: routeConfig.statusCode,
                    validator: routeConfig.validator as ValidatorDefinition | undefined,
                    handler: {
                        instance,
                        methodName,
                        tracer
                    },
                    responseType,
                    middlewares: middlewares ? middlewares.map(middleware => this.resolveMiddleware(middleware)) : [],
                });
            }
        }
        return controllers
    }

    private resolveMiddleware(middleware: MiddlewareDefinition): Middleware {
        if (typeof middleware === 'function') {
            if (middleware.prototype?.execute) {
                return new (middleware as new (...args: any[]) => Middleware)();
            }
            try {
                const instance = (middleware as () => Middleware)();
                if (!instance?.execute) {
                    throw new FrameworkError('Middleware must implement execute()');
                }
                return instance;
            } catch (error) {
                throw new FrameworkError('Middleware must implement execute()');
            }
        }
        if (!middleware?.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        return middleware;
    }

    private buildRoute(baseRoute: string, version?: number, prefix?: string) {
        let route = baseRoute;
        if (version !== undefined) {
            route = this.joinSegments(`v${version}`, route);
        }
        if (prefix) {
            route = this.joinSegments(prefix, route);
        }
        return route;
    }

    private joinSegments(left: string, right: string) {
        const normalizedLeft = this.trimSlashes(left);
        const normalizedRight = this.trimLeadingSlash(right);
        const combined = [normalizedLeft, normalizedRight].filter(Boolean).join('/');
        return combined ? `/${combined}` : '/';
    }

    private trimLeadingSlash(value: string) {
        return value.startsWith('/') ? value.slice(1) : value;
    }

    private trimTrailingSlash(value: string) {
        if (value === '/') return '';
        return value.endsWith('/') ? value.slice(0, -1) : value;
    }

    private trimSlashes(value: string) {
        if (value === '/') return '';
        let trimmed = this.trimLeadingSlash(value);
        trimmed = this.trimTrailingSlash(trimmed);
        return trimmed;
    }
}

function isValidatorDefinition(value: unknown): value is Exclude<ValidatorDefinition, ValidatorLike> {
    return !!value && typeof value === 'object' && 'validator' in value
}
