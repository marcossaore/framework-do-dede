import { Container, DefaultContainer } from "@/infra/di/registry";
import 'reflect-metadata';

export interface StorageGateway {
  save(file: File, path: string): Promise<void>
  get(key: string): Promise<string>
  delete(key: string): Promise<boolean>
}

export function Storage(gatewayName: string, container: Container = DefaultContainer) {
  return function (target: any, propertyKey: string): void {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return new Proxy({}, {
          get(_: any, prop: string) {
            const dependency = container.inject(gatewayName);
            if (!dependency?.save || !dependency?.get || !dependency?.delete) {
              throw new Error(`${gatewayName} is not a valid StorageGateway`);
            }
            return dependency[prop];
          }
        });
      },
      enumerable: true,
      configurable: true
    });
  };
}
