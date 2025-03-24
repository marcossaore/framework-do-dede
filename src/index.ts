import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject } from './decorators'
import { UseCaseHandler } from './handlers'
import { ServerError } from './http'


interface HttpMiddleware {
    execute(input: any): Promise<any>
}

interface UseCase<Input, Output>  {
    execute(input: Input): Promise<Output>
}

interface Validation {
    validate(input: any): any;
}
 
type RequestData = {
    headers: any,
    data: any,
    middlewareData: any
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