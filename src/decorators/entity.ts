export function Restrict() {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._restrictedProperties) {
            target.constructor._restrictedProperties = new Set();
        }
        target.constructor._restrictedProperties.add(propertyKey);
    };
}

export function VirtualProperty(propertyName: string) {
    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
        const ctor = target.constructor;
        if (!ctor._exposedProperties) {
            ctor._exposedProperties = new Map();
        }
        ctor._exposedProperties.set(propertyName, methodName);
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