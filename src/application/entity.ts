export abstract class Entity {
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
             const valueIsZero = !isNaN(value) ? Number(value) === 0: false;
            // @ts-ignore
            if (propertiesConfigs && propertiesConfigs[propName]?.serialize && (value || valueIsZero)) {
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
            if (!value && !valueIsZero) value = null;
            result[propertyName] = value;
        }
        return result;
    }

    async toAsyncEntity(): Promise<Record<string, any>> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            let propertyName = propName;
            let value = (this as any)[propName];
            if (typeof value === 'function') continue;
            if (value === undefined) continue;
            // @ts-ignore
            const valueIsZero = !isNaN(value) ? Number(value) === 0: false;
            if (propertiesConfigs && propertiesConfigs[propName]?.serialize && (value || valueIsZero)) {
                const serializedValue = await propertiesConfigs[propName].serialize(value);
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
            if (!value && !valueIsZero) value = null;
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

    async toAsyncData({ serialize = true }: { serialize?: boolean } = {}): Promise<Record<string, any>> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        // @ts-ignore
        const virtualProperties = this.constructor.virtualProperties as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            if (typeof (this as any)[propName] === 'function') continue;
            if (propertiesConfigs && propertiesConfigs[propName]?.restrict) continue;
            // @ts-ignore
            let value = (this as any)[propName];
            if (serialize && propertiesConfigs && propertiesConfigs[propName]?.serialize && value) {
                value = await propertiesConfigs[propName].serialize(value);
            }
            result[propName] = value;
        }
        if (virtualProperties) {
            for (const [methodName, propName] of Object.entries(virtualProperties)) {
                if (this.__proto__[methodName]) {
                    result[propName] = await (this as any)[methodName]();
                }
            }
        }
        return result;
    }

    protected generateGetters() {
        for (const property of Object.keys(this)) {
            if (typeof this[property] === 'function') continue;
            let prefixName = null;

            // @ts-ignore
            if (this.constructor.propertiesConfigs && this.constructor.propertiesConfigs[property] && this.constructor.propertiesConfigs[property].prefix) {
                // @ts-ignore
                prefixName = this.constructor.propertiesConfigs[property].prefix;
            } else {
                const isBoolean = this[property] ? typeof this[property] === 'boolean' : false;
                prefixName = isBoolean ? 'is' : 'get';
            }
            let getterName = null
            if (property[0]) {
                getterName = `${prefixName}${property[0].toUpperCase()}${property.slice(1)}`
                if (this[getterName]) continue;
                this[getterName] = () => this[property];
            }
        }
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
