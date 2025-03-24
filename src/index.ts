import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject } from './decorators'
import { UseCaseHandler } from './handlers'
import { ServerError } from './http'
import { HttpMiddleware, Validation, UseCase } from './protocols'

export type {
    HttpMiddleware,
    Validation,
    UseCase,
    DedeRegister,
    DedeOptions,
}


export {
    Dede,
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