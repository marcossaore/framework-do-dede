import 'reflect-metadata';
import { FrameworkError } from "@/http/errors/framework";
import { Registry } from "@/infra/di/registry";

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

let controllers: string[] = [];
  
export function Controller(basePath: string = '/') {
    return function (target: any) {
        if (!basePath) throw new FrameworkError('basePath cannot be empty');
        Reflect.defineMetadata('basePath', basePath, target);
        controllers.push(target.name);
        Registry.load(target.name, target);
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

export function getControllers(): any[] {
    return controllers.map((controller) => Registry.inject(controller));
}

export function flushControllers() {
    controllers.map((controller) => {
        Registry.remove(controller) 
    });
    controllers = [];
}

function isClass(fn: Function): boolean {
    return /^\s*class\s/.test(Function.prototype.toString.call(fn));
}

export function UseMiddleware(middlewareClass: MiddlewareDefinition) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (typeof middlewareClass !== 'function' && !middlewareClass?.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        if (typeof middlewareClass === 'function' && isClass(middlewareClass) && !middlewareClass.prototype?.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        if (typeof middlewareClass === 'function' && middlewareClass.prototype?.execute) {
            const middlewares: MiddlewareDefinition[] = Reflect.getMetadata('middlewares', target, propertyKey) || [];
            middlewares.push(middlewareClass);
            Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
            return;
        }
        const middlewares: MiddlewareDefinition[] = Reflect.getMetadata('middlewares', target, propertyKey) || [];
        middlewares.push(middlewareClass as MiddlewareDefinition);
        Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
    };
}

export function UseMiddlewares(middlewareClasses: MiddlewareDefinition[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        for (const middlewareClass of middlewareClasses) {
            if (typeof middlewareClass !== 'function' && !middlewareClass?.execute) {
                throw new FrameworkError('Middleware must implement execute()');
            }
            if (typeof middlewareClass === 'function' && isClass(middlewareClass) && !middlewareClass.prototype?.execute) {
                throw new FrameworkError('Middleware must implement execute()');
            }
        }
        const existingMiddlewares: MiddlewareDefinition[] = 
            Reflect.getMetadata('middlewares', target, propertyKey) || [];
        existingMiddlewares.push(...middlewareClasses);
        Reflect.defineMetadata('middlewares', existingMiddlewares, target, propertyKey);
    };
}

export function Post(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter,  responseType?: 'json' | 'text' | 'html' } = {}) {
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
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}

export function Get(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], responseType?: 'json' | 'text' | 'html' } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'get',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}

export function Put(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter,  responseType?: 'json' | 'text' | 'html' } = {}) {
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
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}

export function Patch(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter, responseType?: 'json' | 'text' | 'html' } = {}) {
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
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}

export function Delete(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], body?: string[], bodyFilter?: BodyFilter, responseType?: 'json' | 'text' | 'html' } = {}) {
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
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}
