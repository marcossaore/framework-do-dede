import { Registry } from "@/infra/di/registry";
import 'reflect-metadata';

export interface StorageGateway {
  save(file: File, path: string): Promise<void>
  get(key: string): Promise<string>
  delete(key: string): Promise<boolean>
}

export function Storage(gatewayName: string) {
  return function (target: any, propertyKey: string): void {
    let dependency: any;
    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (!dependency) {
          dependency = Registry.inject(gatewayName);
        }
        if (!dependency.save || !dependency.get || !dependency.delete) {
          throw new Error(`${gatewayName} is not a valid StorageGateway`);
        }
        return dependency;
      },
      enumerable: true,
      configurable: true
    });
  };
}