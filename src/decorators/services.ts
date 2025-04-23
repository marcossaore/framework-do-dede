import { Registry } from "@/di/registry";
import { StorageGateway } from "@/protocols/StorageGateway";

export function Storage() {
    return function (target: any, propertyKey: string) {
        const designType = Reflect.getMetadata('design:type', target, propertyKey);

        if (!(designType?.prototype instanceof StorageGateway)) {
            throw new Error(`@Storage() can only be used with StorageGateway subclasses`);
        }

        const gatewayName = designType.name;

        if (!Registry.has(gatewayName)) {
            throw new Error(`StorageGateway ${gatewayName} not registered`);
        }

        const instanceSymbol = Symbol();

        Object.defineProperty(target, propertyKey, {
            get: function () {
                if (!this[instanceSymbol]) {
                    const GatewayClass = Registry.resolve(gatewayName)!;
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