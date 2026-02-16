import 'reflect-metadata';
import { FrameworkError } from "@/http/errors/framework";
import type { ValidatorDefinition } from "@/interface/validation/validator";

export interface Middleware {
    execute(input: Input<any>): Promise<any>
}

export type MiddlewareClass = new (...args: any[]) => Middleware
export type MiddlewareFactory = () => Middleware
export type MiddlewareDefinition = Middleware | MiddlewareClass | MiddlewareFactory

export interface TracerData {
    requestedAt: Date
    elapsedTime: string
    route: string
    method: string
    middlewares: { elapsedTime: string, middleware: string, error?: any }[]
    error?: any,
    headers: Record<string, string>
}

export interface Tracer<R> {
   trace(data: TracerData): R
}

export interface Input<T, K = any> {
    data: T
    context?: K
}

type BodyFilter = "restrict" | "none"

export function Controller(basePath: string = '/') {
    return function (target: any) {
        if (!basePath) throw new FrameworkError('basePath cannot be empty');
        Reflect.defineMetadata('basePath', basePath, target);
    };
}

export function Tracing<R>(tracer: Tracer<R>) {
    return function (target: any, propertyKey?: string) {
        if (!propertyKey) {
            Reflect.defineMetadata('tracer', tracer, target);
        } else {
            Reflect.defineMetadata('tracer', tracer, target, propertyKey);
        }
    };
}

export function Version(version: number) {
    return function (target: any, propertyKey?: string) {
        if (!Number.isInteger(version) || version <= 0) {
            throw new FrameworkError('Version must be a positive integer');
        }
        if (!propertyKey) {
            Reflect.defineMetadata('version', version, target);
        } else {
            Reflect.defineMetadata('version', version, target, propertyKey);
        }
    };
}

export function PresetIgnore(ignorePrefix: boolean = true, ignoreVersion: boolean = true) {
    return function (target: any, propertyKey?: string) {
        const ignoreConfig = { prefix: ignorePrefix, version: ignoreVersion };
        if (!propertyKey) {
            Reflect.defineMetadata('presetIgnore', ignoreConfig, target);
        } else {
            Reflect.defineMetadata('presetIgnore', ignoreConfig, target, propertyKey);
        }
    };
}

function isClass(fn: Function): boolean {
    return /^\s*class\s/.test(Function.prototype.toString.call(fn));
}

export function UseMiddleware(middlewareClass: MiddlewareDefinition) {
    return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
        if (typeof middlewareClass !== 'function' && !middlewareClass?.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        if (typeof middlewareClass === 'function' && isClass(middlewareClass) && !middlewareClass.prototype?.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        const metadataTarget = propertyKey ? target : target;
        const metadataKey = propertyKey ?? undefined;
        if (typeof middlewareClass === 'function' && middlewareClass.prototype?.execute) {
            const middlewares: MiddlewareDefinition[] = metadataKey
                ? Reflect.getMetadata('middlewares', metadataTarget, metadataKey) || []
                : Reflect.getMetadata('middlewares', metadataTarget) || [];
            middlewares.push(middlewareClass);
            if (metadataKey) {
                Reflect.defineMetadata('middlewares', middlewares, metadataTarget, metadataKey);
            } else {
                Reflect.defineMetadata('middlewares', middlewares, metadataTarget);
            }
            return;
        }
        const middlewares: MiddlewareDefinition[] = metadataKey
            ? Reflect.getMetadata('middlewares', metadataTarget, metadataKey) || []
            : Reflect.getMetadata('middlewares', metadataTarget) || [];
        middlewares.push(middlewareClass as MiddlewareDefinition);
        if (metadataKey) {
            Reflect.defineMetadata('middlewares', middlewares, metadataTarget, metadataKey);
        } else {
            Reflect.defineMetadata('middlewares', middlewares, metadataTarget);
        }
    };
}

export function UseMiddlewares(middlewareClasses: MiddlewareDefinition[]) {
    return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
        for (const middlewareClass of middlewareClasses) {
            if (typeof middlewareClass !== 'function' && !middlewareClass?.execute) {
                throw new FrameworkError('Middleware must implement execute()');
            }
            if (typeof middlewareClass === 'function' && isClass(middlewareClass) && !middlewareClass.prototype?.execute) {
                throw new FrameworkError('Middleware must implement execute()');
            }
        }
        const metadataTarget = propertyKey ? target : target;
        const metadataKey = propertyKey ?? undefined;
        const existingMiddlewares: MiddlewareDefinition[] = metadataKey
            ? Reflect.getMetadata('middlewares', metadataTarget, metadataKey) || []
            : Reflect.getMetadata('middlewares', metadataTarget) || [];
        existingMiddlewares.push(...middlewareClasses);
        if (metadataKey) {
            Reflect.defineMetadata('middlewares', existingMiddlewares, metadataTarget, metadataKey);
        } else {
            Reflect.defineMetadata('middlewares', existingMiddlewares, metadataTarget);
        }
    };
}

export function Post(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter, responseType?: 'json' | 'text' | 'html', validator?: ValidatorDefinition } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'post',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            body: config.body,
            bodyFilter: config.bodyFilter || 'none',
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json',
            validator: config.validator
        }, target, propertyKey);
    };
}

export function Get(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], responseType?: 'json' | 'text' | 'html', validator?: ValidatorDefinition } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'get',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json',
            validator: config.validator
        }, target, propertyKey);
    };
}

export function Put(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter, responseType?: 'json' | 'text' | 'html', validator?: ValidatorDefinition } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'put',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            body: config.body,
            bodyFilter: config.bodyFilter || 'none',
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json',
            validator: config.validator
        }, target, propertyKey);
    };
}

export function Patch(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter, responseType?: 'json' | 'text' | 'html', validator?: ValidatorDefinition } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'patch',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            body: config.body,
            bodyFilter: config.bodyFilter || 'none',
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json',
            validator: config.validator
        }, target, propertyKey);
    };
}

export function Delete(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter, responseType?: 'json' | 'text' | 'html', validator?: ValidatorDefinition } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'delete',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            body: config.body,
            bodyFilter: config.bodyFilter || 'none',
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json',
            validator: config.validator
        }, target, propertyKey);
    };
}
