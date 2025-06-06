export abstract class Entity {
    [x: string]: any;
    toEntity(): Record<string, any> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            let value = (this as any)[propName];
            if (typeof value === 'function') continue;
            if (propertiesConfigs[propName]?.serialize && value) {
                value = propertiesConfigs[propName].serialize(value);
            }
            if (!value) value = null;
            result[propName] = value;
        }
        return result;
    }

    async toAsyncEntity(): Promise<Record<string, any>> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            let value = (this as any)[propName];
            if (typeof value === 'function') continue;
            if (propertiesConfigs[propName]?.serialize && value) {
                value = await propertiesConfigs[propName].serialize(value);
            }
            if (!value) value = null;
            result[propName] = value;
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
            if (propertiesConfigs[propName]?.restrict) continue;
            if (typeof (this as any)[propName] === 'function') continue;
            let value = (this as any)[propName];
            if (serialize && propertiesConfigs[propName]?.serialize && value) {
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

    async toAsyncData({ serialize = false }: { serialize?: boolean } = {}): Promise<Record<string, any>> {
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        // @ts-ignore
        const virtualProperties = this.constructor.virtualProperties as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            if (typeof (this as any)[propName] === 'function') continue;
            if (propertiesConfigs[propName]?.restrict) continue;
            let value = (this as any)[propName];
            if (serialize && propertiesConfigs[propName]?.serialize && value) {
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
            if (typeof property === 'function') continue;
            if (!this[property]) {
                // @ts-ignore
                const prefixName = this.constructor.propertiesConfigs[property].prefix;
                const getterName = `${prefixName}${property[0].toUpperCase()}${property.slice(1)}`;
                if (this[getterName]) continue;
                this[getterName] = () => this[property];
            } else {
                // @ts-ignore
                const prefixName = this.constructor.propertiesConfigs[property]?.prefix || (typeof this[property] === 'boolean' ? 'is' : 'get');
                const getterName = `${prefixName}${property[0].toUpperCase()}${property.slice(1)}`;
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