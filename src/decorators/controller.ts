import { FrameworkError } from "@/http/FrameworkError";
import { Validation } from "@/protocols/Validation";
import { Registry } from "@/di/registry";
import { HttpMiddleware } from "@/protocols";

export function Controller(basePath: string) {
    return function (target: any) {
        Reflect.defineMetadata('basePath', basePath, target);
        if (!Registry.has('controllers')) Registry.register('controllers', []);
        Registry.addDependency('controllers', target);
    };
}

// export function Middleware(middlewareClass: new () => HttpMiddleware) {
//     return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//         if (typeof middlewareClass.prototype.execute !== 'function') {
//             throw new FrameworkError('The concrete class does not implement the Middleware interface.');
//         }

//         // Retrieve existing middlewares for this method or initialize an empty array
//         const middlewares: HttpMiddleware[] = Reflect.getMetadata('middlewares', target, propertyKey) || [];

//         // Create a new instance of the middleware and add it to the array
//         const middlewareInstance = new middlewareClass();
//         middlewares.push(middlewareInstance);


//         // Update the metadata with the new array of middleware instances
//         Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
//     };
// }

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


export function Validator(validationClass: new () => Validation) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (typeof validationClass.prototype.validate !== 'function') {
            throw new FrameworkError('the concrete class does not implement Validation class".');
        }
        Reflect.defineMetadata('validation', new validationClass(), target, propertyKey);
    };
}

