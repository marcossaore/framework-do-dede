import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Auth, Inject, Restrict, Metrics, DbColumn, OffConsoleLog } from './decorators'
import { BadRequest, Conflict, Forbidden, HttpServer, NotFound, ServerError, Unauthorized, UnprocessableEntity } from './http'
import { Validation, HttpMiddleware, UseCase, CreateRepository, ExistsById, DeleteRepository, UpdateRepository, RestoreRepository, RestoreManyRepository, RequestMetricsHandler, RequestData, RequestMetrics, HttpServerError } from './protocols'
import { Registry } from './di/registry';
import { Entity } from './domain/Entity'

class UseCaseHandler {
  static load<T extends UseCase<any, any>>(
    useCaseClass: new (...args: any[]) => T,
    request?: RequestData
  ): T {
    const instance = Registry.classLoader(useCaseClass);
    const context = request;
    const prototype = useCaseClass.prototype;
    Reflect.ownKeys(prototype).forEach((propertyKey) => {
      const middlewareKey = Reflect.getMetadata('auth', prototype, propertyKey);
      if (middlewareKey && context?.middlewareData?.[middlewareKey]) {
        (instance as any)[propertyKey] = context.middlewareData[middlewareKey];
      }
    });
    return instance;
  }
}

export {
  UseCase,
  HttpMiddleware,
  Validation,
  RequestMetricsHandler,
  RequestMetrics,
  HttpServerError,
  CreateRepository,
  DeleteRepository,
  UpdateRepository,
  RestoreRepository,
  ExistsById,
  RestoreManyRepository,
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
  Restrict,
  DbColumn,
  Metrics,
  OffConsoleLog
}