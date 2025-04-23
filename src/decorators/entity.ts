export function Restrict() {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._restrictedProperties) {
            target.constructor._restrictedProperties = new Set();
        }
        target.constructor._restrictedProperties.add(propertyKey);
    };
}

export type ExposeConfig = {
    mapping?: string | Record<string, string>;
    deserialize?: (value: any) => any | Promise<any>;
};

export function Expose(configOrMapping: ExposeConfig | string): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        const ctor = target.constructor;
        const configs = ctor._exposeConfigs || (ctor._exposeConfigs = new Map<string | symbol, ExposeConfig[]>());
        if (typeof configOrMapping === "string") {
            configs.set(propertyKey, [
                ...(configs.get(propertyKey) || []),
                { 
                    mapping: configOrMapping,
                    deserialize: (value: any) => value
                }
            ]);
        } 
        else {
            configs.set(propertyKey, [
                ...(configs.get(propertyKey) || []),
                {
                    mapping: configOrMapping.mapping,
                    deserialize: configOrMapping.deserialize || ((value: any) => value)
                }
            ]);
        }
    };
}

export function VirtualProperty(propertyName: string) {
    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
        const ctor = target.constructor;
        if (!ctor._virtualProperties) {
            ctor._virtualProperties = new Map();
        }
        ctor._virtualProperties.set(propertyName, methodName);
    };
}

type DbColumnConfig = {
    mapping?: string | Record<string, string>;
    serialize?: (value: any) => any | Promise<any>;
};

export function DbColumn(config: string | Record<string, string> | DbColumnConfig) {
    return function (target: Object, propertyKey: string) {
        const ctor = target.constructor as any;
        let actualMapping: string | Record<string, string>;
        let serialize: ((value: any) => any | Promise<any>) | undefined;

        if (typeof config === 'string') {
            actualMapping = config;
        } else if (typeof config === 'object') {
            if ('serialize' in config || 'mapping' in config) {
                actualMapping = config.mapping ?? propertyKey;
                // @ts-ignore
                serialize = config.serialize;
            } else {
                // @ts-ignore
                actualMapping = config;
            }
        } else {
            throw new Error('Configuração inválida para @DbColumn');
        }
    };
}