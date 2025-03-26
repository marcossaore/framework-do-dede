import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject, Restrict } from './decorators'
import { BadRequest, Conflict, Forbidden, HttpServer, NotFound, ServerError, Unauthorized, UnprocessableEntity } from './http'
import { Validation, HttpMiddleware, UseCase, CreateRepository, DeleteRepository, UpdateRepository, RestoreRepository } from './protocols'
import { Registry } from './di/registry';
import { Entity } from './domain/Entity'
 
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
      const authProperty  = Reflect.getMetadata("auth", useCaseClass.prototype.constructor);
      const context = request
      if (authProperty  && context?.middlewareData?.[authProperty]) {
        (instance as any)[authProperty] = {...context.middlewareData[authProperty]}
      }
      return instance
    }
}

export {
    UseCase,
    HttpMiddleware,
    Validation,
    CreateRepository,
    DeleteRepository,
    UpdateRepository,
    RestoreRepository,
    RequestData,
    Dede,
    DedeRegister,
    DedeOptions,
    UseCaseHandler,
    ServerError,
    BadRequest,
    Conflict,
    Forbidden,
    HttpServer,
    NotFound,
    Unauthorized,
    UnprocessableEntity,
    Controller,
    Post,
    Put,
    Get,
    Delete,
    Patch,
    Validator,
    Middleware,
    Auth,
    Inject,
    Entity,
    Restrict
}