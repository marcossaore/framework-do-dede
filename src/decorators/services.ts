import { Registry } from "@/di/registry";
import { StorageGateway } from "@/protocols/StorageGateway";
import { Log } from "@/utils/Log";
import { Testing } from "@/utils/Testing";

export function Storage(gatewayName: string) {
    return function (target: any, propertyKey: string) {

      if(Testing.isEnabled()) {
        Log.info(`@Storage ${gatewayName} is ignored in testing mode`);
        return
      }

      // Verifica se a classe está registrada
      if (!Registry.has(gatewayName)) {
        throw new Error(`StorageGateway ${gatewayName} not registered`);
      }
  
      const GatewayClass = Registry.resolve(gatewayName)!;
      
      // Valida se a classe registrada é uma subclasse de StorageGateway
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