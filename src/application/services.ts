import { Container, DefaultContainer } from "@/infra/di/registry";
import 'reflect-metadata';

export interface StorageGateway {
  save(file: File, path: string): Promise<void>
  get(key: string): Promise<string>
  delete(key: string): Promise<boolean>
}

export interface CacheGateway {
  get<T = unknown>(key: string, toObject?: boolean): Promise<T | null> | T | null
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> | void
  delete(key: string): Promise<boolean> | boolean
}

export type EventPayload = Record<string, any>;

export type Event = {
  name: string
  payload?: EventPayload
};

export interface EventDispatcher {
  dispatch(event: Event): Promise<void> | void
}

function defineGatewayProperty(
  target: any,
  propertyKey: string,
  gatewayName: string,
  container?: Container,
  validator?: (dependency: any) => boolean,
  errorMessage?: string
): void {
  Object.defineProperty(target, propertyKey, {
    get: function () {
      return new Proxy({}, {
        get(_: any, prop: string) {
          const resolvedContainer = container ?? DefaultContainer;
          const dependency = resolvedContainer.inject(gatewayName);
          if (validator && !validator(dependency)) {
            throw new Error(errorMessage ?? `${gatewayName} is not a valid dependency`);
          }
          return dependency[prop];
        }
      });
    },
    enumerable: true,
    configurable: true
  });
}

export function Storage(gatewayName: string, container?: Container) {
  return function (target: any, propertyKey: string): void {
    defineGatewayProperty(
      target,
      propertyKey,
      gatewayName,
      container,
      (dependency) => !!dependency?.save && !!dependency?.get && !!dependency?.delete,
      `${gatewayName} is not a valid StorageGateway`
    );
  };
}

export function CacheGateway(gatewayName: string, container?: Container) {
  return function (target: any, propertyKey?: string): void {
    const resolvedProperty = propertyKey ?? 'cache';
    const resolvedTarget = propertyKey ? target : target.prototype;
    defineGatewayProperty(
      resolvedTarget,
      resolvedProperty,
      gatewayName,
      container,
      (dependency) => !!dependency?.get && !!dependency?.set && !!dependency?.delete,
      `${gatewayName} is not a valid CacheGateway`
    );
  };
}

export function EventDispatcher(dispatcherName: string, container?: Container) {
  return function (target: any, propertyKey?: string): void {
    const resolvedProperty = propertyKey ?? 'eventDispatcher';
    const resolvedTarget = propertyKey ? target : target.prototype;
    defineGatewayProperty(
      resolvedTarget,
      resolvedProperty,
      dispatcherName,
      container,
      (dependency) => !!dependency?.dispatch,
      `${dispatcherName} is not a valid EventDispatcher`
    );
  };
}
