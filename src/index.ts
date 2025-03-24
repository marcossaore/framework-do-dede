import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject } from './decorators'
import { UseCaseHandler } from './handlers'
import { ServerError } from './http'
import { Registry } from './di/registry'


interface HttpMiddleware {
    execute(input: any): Promise<any>
}

interface UseCase<Input, Output>  {
    execute(input: Input): Promise<Output>
}

interface Validation {
    validate(input: any): any;
}
 
class RequestData {
    constructor(
        public headers: any,
        public data: any,
        public middlewareData: any
    ) {}
}

class UseCaseHandler {
    static load<T extends UseCase<any, any>>(
      useCaseClass: new (...args: any[]) => T,
      request?: RequestData
    ): T {
      const instance = Registry.classLoader(useCaseClass);
      const auth = Reflect.getMetadata("auth", useCaseClass);
      const context = request
      if (auth && context?.middlewareData) {
        (instance as any)[auth] = context.middlewareData[auth]
      }
      return instance
    }
  }

export {
    UseCase,
    HttpMiddleware,
    Validation,
    RequestData,
    Dede,
    DedeRegister,
    DedeOptions,
    UseCaseHandler,
    ServerError,
    Controller,
    Post,
    Put,
    Get,
    Delete,
    Patch,
    Validator,
    Middleware,
    Auth,
    Inject
}