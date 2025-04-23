import { Registry } from "@/di/registry";
import { StorageGateway } from "@/protocols/StorageGateway";

export function Storage(gatewayName: string) {
  return function (target: any, propertyKey: string) {
    const instanceSymbol = Symbol();
    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (!this[instanceSymbol]) {
          // Lazy load the gateway when the property is first accessed
          if (!Registry.has(gatewayName)) {
            throw new Error(`StorageGateway ${gatewayName} not registered`);
          }
          const GatewayClass = Registry.resolve(gatewayName)!;
          if (!(GatewayClass instanceof StorageGateway)) {
            throw new Error(`${gatewayName} is not a valid StorageGateway`);
          }
          this[instanceSymbol] = GatewayClass;
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