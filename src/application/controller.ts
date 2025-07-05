import 'reflect-metadata';
import { FrameworkError } from "@/http/errors/framework";
import { Registry } from "@/infra/di/registry";

export interface Middleware {
    execute(input: Input<any>): Promise<any>
}

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

export function UseMiddleware(middlewareClass: new (...args: any[]) => Middleware) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!middlewareClass.prototype.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        const middlewares: Array<new (...args: any[]) => Middleware> = Reflect.getMetadata('middlewares', target, propertyKey) || [];
        middlewares.push(middlewareClass);
        Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
    };
}

export function UseMiddlewares(middlewareClasses: (new (...args: any[]) => Middleware)[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        for (const middlewareClass of middlewareClasses) {
            if (!middlewareClass.prototype.execute) {
                throw new FrameworkError('Middleware must implement execute()');
            }
        }
        const existingMiddlewares: Array<new (...args: any[]) => Middleware> = 
            Reflect.getMetadata('middlewares', target, propertyKey) || [];
        existingMiddlewares.push(...middlewareClasses);
        Reflect.defineMetadata('middlewares', existingMiddlewares, target, propertyKey);
    };
}

export function Post(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], responseType?: 'json' | 'text' | 'html' } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'post',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
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

export function Put(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], responseType?: 'json' | 'text' | 'html' } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'put',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}

export function Patch(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], responseType?: 'json' | 'text' | 'html' } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'patch',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}

export function Delete(config: { path?: string, statusCode?: number, params?: string[], query?: string[], headers?: string[], responseType?: 'json' | 'text' | 'html' } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'delete',
            path: config.path || '',
            params: config.params,
            query: config.query,
            headers: config.headers,
            statusCode: config.statusCode || 200,
            responseType: config.responseType || 'json'
        }, target, propertyKey);
    };
}