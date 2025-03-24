import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject } from './decorators'
import { UseCaseHandler } from './handlers'
import { ServerError } from './http'
import { HttpMiddleware as HttpMiddlewareInterface, Validation as ValidationInterface, UseCase as UseCaseInterface } from './protocols'

type UseCase = UseCaseInterface<any, any>  
type Validation = ValidationInterface
type HttpMiddleware = HttpMiddlewareInterface

export {
    Dede,
    DedeRegister,
    DedeOptions,
    UseCaseHandler,
    ServerError,
    HttpMiddleware,
    Validation,
    UseCase,
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