import { Registry } from "@/di/registry";
import { StorageGateway } from "@/protocols/StorageGateway";
import { Log } from "@/utils/Log";

export function Storage(gatewayName: string) {
    return function (target: any, propertyKey: string) {
      while (!Registry.isLoaded()) {
        Log.info('Waiting for dependencies to be loaded...');
      }

      if (!Registry.has(gatewayName)) {
        throw new Error(`StorageGateway ${gatewayName} not registered`);
      }
  
      const GatewayClass = Registry.resolve(gatewayName)!;
      
      if (!(GatewayClass instanceof StorageGateway)) {
        throw new Error(`${gatewayName} is not a valid StorageGateway`);
      }
  
      const instanceSymbol = Symbol();
  
      Object.defineProperty(target, propertyKey, {
        get: function () {
          if (!this[instanceSymbol]) {
            this[instanceSymbol] = GatewayClass
          }
          return this[instanceSymbol];
        },
        set: () => {
          throw new Error('Cannot assign new value to @Storage() property');
        },
        enumerable: true,
        configurable: true
      });
    };
  }