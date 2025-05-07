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

export type DbColumnConfig<T = any> = {
    column?: string | Record<string, string>;
    serialize?: (value: T) => any | Promise<any>;
};

export function DbColumn<T>(configOrColumn: DbColumnConfig<T> | string): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        const ctor = target.constructor;
        const configs = ctor._dbColumnConfigs || (ctor._dbColumnConfigs = new Map<string | symbol, DbColumnConfig<any>[]>());

        if (typeof configOrColumn === "string") {
            configs.set(propertyKey, [
                ...(configs.get(propertyKey) || []),
                { 
                    column: configOrColumn,
                    serialize: (value: any) => value
                }
            ]);
        } 
        else {
            configs.set(propertyKey, [
                ...(configs.get(propertyKey) || []),
                {
                    column: configOrColumn.column,
                    serialize: configOrColumn.serialize || ((value: any) => value)
                }
            ]);
        }
    };
}