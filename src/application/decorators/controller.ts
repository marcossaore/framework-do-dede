import 'reflect-metadata';
import { FrameworkError } from "@/http/FrameworkError";
import { Registry } from "@/infra/di/registry";
import { HttpMiddleware, RequestMetricsHandler } from "@/protocols";

export function Controller(basePath: string) {
    return function (target: any) {
        if (basePath === '') throw new FrameworkError('basePath cannot be empty');
        Reflect.defineMetadata('basePath', basePath, target);
        Registry.load(target.name, target);
    };
}

export function Middleware(middlewareClass: new (...args: any[]) => HttpMiddleware) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!middlewareClass.prototype.execute) {
            throw new FrameworkError('Middleware must implement execute()');
        }
        const middlewares: Array<new (...args: any[]) => HttpMiddleware> = Reflect.getMetadata('middlewares', target, propertyKey) || [];
        middlewares.push(middlewareClass);
        Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
    };
}


export function Middlewares(middlewareClasses: (new (...args: any[]) => HttpMiddleware)[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        for (const middlewareClass of middlewareClasses) {
            if (!middlewareClass.prototype.execute) {
                throw new FrameworkError('Middleware must implement execute()');
            }
        }
        const existingMiddlewares: Array<new (...args: any[]) => HttpMiddleware> = 
            Reflect.getMetadata('middlewares', target, propertyKey) || [];
        existingMiddlewares.push(...middlewareClasses);
        Reflect.defineMetadata('middlewares', existingMiddlewares, target, propertyKey);
    };
}


export function Post(config: { path?: string, statusCode?: number, params?: string[], query?: string[] } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'post',
            path: config.path || '',
            params: config.params,
            query: config.query,
            statusCode: config.statusCode || 200
        }, target, propertyKey);
    };
}

export function Get(config: { path?: string, statusCode?: number, params?: string[], query?: string[] } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'get',
            path: config.path || '',
            params: config.params,
            query: config.query,
            statusCode: config.statusCode || 200
        }, target, propertyKey);
    };
}

export function Put(config: { path?: string, statusCode?: number, params?: string[], query?: string[] } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'put',
            path: config.path || '',
            params: config.params,
            query: config.query,
            statusCode: config.statusCode || 200
        }, target, propertyKey);
    };
}


export function Patch(config: { path?: string, statusCode?: number, params?: string[], query?: string[] } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'patch',
            path: config.path || '',
            params: config.params,
            query: config.query,
            statusCode: config.statusCode || 200
        }, target, propertyKey);
    };
}

export function Delete(config: { path?: string, statusCode?: number, params?: string[], query?: string[] } = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('route', {
            method: 'delete',
            path: config.path || '',
            params: config.params,
            query: config.query,
            statusCode: config.statusCode || 200
        }, target, propertyKey);
    };
}

// export function Metrics(...handlers: (new (...args: any[]) => RequestMetricsHandler)[]): MethodDecorator {
//     return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
//         Reflect.defineMetadata('metricsHandlers', handlers, target, propertyKey);
//     };
// }

// export function OffConsoleLog() {
//     return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//         Reflect.defineMetadata('offConsoleLog', true, target, propertyKey);
//     };
// }