import { Dede, Register as DedeRegister, Options as DedeOptions } from './dede'
import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Patch,
  Validator,
  Middleware,
  Middlewares,
  Context,
  DecorateUseCase,
  Inject,
  Restrict,
  Metrics,
  DbColumn,
  VirtualProperty,
  OffConsoleLog,
  Storage,
  Expose
} from './decorators'
import {
  BadRequest,
  Conflict,
  Forbidden,
  HttpServer,
  NotFound,
  ServerError,
  Unauthorized,
  UnprocessableEntity
} from './http'
import {
  Validation,
  HttpMiddleware,
  UseCase,
  CreateRepository,
  ExistsBy,
  NotExistsBy,
  DeleteRepository,
  DeleteRepositoryBy,
  UpdateRepository,
  RestoreRepository,
  RestoreRepositoryBy,
  RestoreManyRepository,
  RequestMetricsHandler,
  Request,
  RequestMetrics,
  HttpServerError,
  StorageGateway
} from './protocols'
import { Registry } from './di/registry';
import { Entity } from './domain/Entity'
import { USE_CASE_DECORATORS } from './decorators/usecase';

class UseCaseHandler {
  static load<T extends UseCase<any, any>>(
    useCaseClass: new (...args: any[]) => T,
    request?: Request
  ): T {
    const instance = Registry.classLoader(useCaseClass);
    const useCaseDecorators = Reflect.getMetadata(USE_CASE_DECORATORS, useCaseClass) || [];
    const useCaseDecoratorsInstances: UseCase<any, any>[] = []
    for (const useCaseDecorator of useCaseDecorators) {
      useCaseDecoratorsInstances.push(Registry.classLoader(useCaseDecorator));
    }
    const context = request;
    const contextMetadata: Array<{ propertyKey: string, middlewareKey: string }> =
      Reflect.getMetadata('context', useCaseClass) || [];
    contextMetadata.forEach(({ propertyKey, middlewareKey }) => {
      if (context?.middlewareData?.[middlewareKey]) {
        (instance as any)[propertyKey] = context.middlewareData[middlewareKey];
        for (let index = 0; index < useCaseDecoratorsInstances.length; index++) {
          (useCaseDecoratorsInstances[index] as any)[propertyKey] = context.middlewareData[middlewareKey];
        }
      }
    });

    const originalExecute = instance.execute.bind(instance);

    instance.execute = async (input: any) => {
      for await (const useCaseDecoratorsInstance of useCaseDecoratorsInstances) {
        await useCaseDecoratorsInstance.execute(input);
      }
      return originalExecute(input);
    }
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
  DeleteRepositoryBy,
  UpdateRepository,
  RestoreRepository,
  RestoreRepositoryBy,
  ExistsBy,
  NotExistsBy,
  RestoreManyRepository,
  Request,
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
  Middlewares,
  Context,
  DecorateUseCase,
  Inject,
  Entity,
  Restrict,
  DbColumn,
  VirtualProperty,
  Metrics,
  OffConsoleLog,
  StorageGateway,
  Storage,
  Expose
}