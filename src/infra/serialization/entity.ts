import { Entity as DomainEntity } from "@/domain/entity";

export abstract class Entity extends DomainEntity {
    [x: string]: any;

    toEntity(): Record<string, any> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            let propertyName = propName;
            let value = (this as any)[propName];
            if (typeof value === 'function') continue;
            if (value === undefined) continue;
            // @ts-ignore
            if (propertiesConfigs && propertiesConfigs[propName]?.serialize && value) {
                const serializedValue = propertiesConfigs[propName].serialize(value);
                if (serializedValue && typeof serializedValue === 'object' && !Array.isArray(serializedValue)) {
                    const entries = Object.entries(serializedValue);
                    for (const [serializedKey, serializedPropValue] of entries) {
                        let currentValue = serializedPropValue;
                        if (!currentValue) currentValue = null;
                        result[serializedKey] = currentValue;
                    }
                    continue;
                } else {
                    value = serializedValue;
                }
            }
            if (value === undefined || value === null) value = null;
            result[propertyName] = value;
        }
        return result;
    }

    toData({ serialize = false }: { serialize?: boolean } = {}): Record<string, any> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        // @ts-ignore
        const virtualProperties = this.constructor.virtualProperties as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            if (propertiesConfigs && propertiesConfigs[propName]?.restrict) continue;
            if (typeof (this as any)[propName] === 'function') continue;
            // @ts-ignore
            let value = (this as any)[propName];
            if (serialize && propertiesConfigs && propertiesConfigs[propName]?.serialize && value) {
                value = propertiesConfigs[propName].serialize(value);
            }
            result[propName] = value;
        }
        if (virtualProperties) {
            for (const [methodName, propName] of Object.entries(virtualProperties)) {
                if (this.__proto__[methodName]) {
                    result[propName] = (this as any)[methodName]();
                }
            }
        }
        return result;
    }

    protected generateGetters() {
        super.generateGetters();
    }
}

export function Restrict() {
    return function (target: any, propertyKey: string) {
        loadPropertiesConfig(target, propertyKey);
        target.constructor.propertiesConfigs[propertyKey].restrict = true;
    };
}

export function VirtualProperty(propertyName: string) {
    return function (target: any, methodName: string) {
        const cls = target.constructor;
        cls.virtualProperties = cls.virtualProperties || {};
        cls.virtualProperties[methodName] = propertyName;
    };
}

export function Serialize(callback: (value: any) => any): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        loadPropertiesConfig(target, propertyKey as string);
        target.constructor.propertiesConfigs[propertyKey].serialize = callback;
    };
}

export function GetterPrefix(prefix: string) {
    return function (target: any, propertyKey: string) {
        loadPropertiesConfig(target, propertyKey);
        target.constructor.propertiesConfigs[propertyKey].prefix = prefix;
    };
}

const loadPropertiesConfig = (target: any, propertyKey: string) => {
    if (!target.constructor.propertiesConfigs) {
        target.constructor.propertiesConfigs = {};
    }
    if (!target.constructor.propertiesConfigs[propertyKey]) {
        target.constructor.propertiesConfigs[propertyKey] = {};
    }
}
