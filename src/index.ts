import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject } from './decorators'
import { UseCaseHandler } from './handlers'
import { ServerError } from './http'


export interface HttpMiddleware {
    execute(input: any): Promise<any>
}

export interface UseCase<Input, Output>  {
    execute(input: Input): Promise<Output>
}

export interface Validation {
    validate(input: any): any;
}
 
export type RequestData = {
    headers: any,
    data: any,
    middlewareData: any
}

export {
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