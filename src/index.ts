import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import { Controller, Post, Put, Get, Delete, Patch, Validator, Middleware, Context, Inject, Restrict, Metrics, DbColumn, VirtualProperty, OffConsoleLog, Storage, Expose } from './decorators'
import { BadRequest, Conflict, Forbidden, HttpServer, NotFound, ServerError, Unauthorized, UnprocessableEntity } from './http'
import { Validation, HttpMiddleware, UseCase, CreateRepository, ExistsById, DeleteRepository, UpdateRepository, RestoreRepository, RestoreManyRepository, RequestMetricsHandler, RequestData, RequestMetrics, HttpServerError, StorageGateway } from './protocols'
import { Registry } from './di/registry';
import { Entity } from './domain/Entity'
import { Testing } from './utils/Testing';

class UseCaseHandler {
  static load<T extends UseCase<any, any>>(
    useCaseClass: new (...args: any[]) => T,
    request?: RequestData
  ): T {
    const instance = Registry.classLoader(useCaseClass);
    const context = request;
    const contextMetadata: Array<{ propertyKey: string, middlewareKey: string }> = 
      Reflect.getMetadata('context', useCaseClass) || [];
      contextMetadata.forEach(({ propertyKey, middlewareKey }) => {
      if (context?.middlewareData?.[middlewareKey]) {
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
  Context,
  Inject,
  Entity,
  Restrict,
  DbColumn,
  VirtualProperty,
  Metrics,
  OffConsoleLog,
  StorageGateway,
  Storage,
  Expose,
  Testing
}