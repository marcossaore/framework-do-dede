export abstract class Entity {
    [x: string]: any;

    private buildRawEntityObject(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            let value = (this as any)[propName];
            if (typeof value === 'function') continue;
            if (value === undefined) continue;
            result[propName] = value;
        }
        return result;
    }

    private getEntityHooks(hookKey: symbol): Array<string | symbol> {
        const hooks: Array<string | symbol> = [];
        let current = this.constructor as any;
        while (current && current !== Entity) {
            const currentHooks = current[hookKey] as Array<string | symbol> | undefined;
            if (currentHooks && currentHooks.length) {
                hooks.unshift(...currentHooks);
            }
            current = Object.getPrototypeOf(current);
        }
        return hooks;
    }

    private runEntityHooks(hookKey: symbol, payload: Record<string, any>, awaitHooks: boolean): void | Promise<void> {
        const hooks = this.getEntityHooks(hookKey);
        if (!hooks.length) return;
        if (awaitHooks) {
            return (async () => {
                for (const hookName of hooks) {
                    const hook = (this as any)[hookName];
                    if (typeof hook !== 'function') continue;
                    await hook.call(this, payload);
                }
            })();
        }
        for (const hookName of hooks) {
            const hook = (this as any)[hookName];
            if (typeof hook !== 'function') continue;
            try {
                const result = hook.call(this, payload);
                if (result && typeof result.then === 'function') {
                    void result.catch(() => undefined);
                }
            } catch (error) {
                throw error;
            }
        }
    }

    toEntity(): Record<string, any> {
        const raw = this.buildRawEntityObject();
        this.runEntityHooks(BEFORE_TO_ENTITY, raw, false);
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
        this.runEntityHooks(AFTER_TO_ENTITY, result, false);
        return result;
    }

    async toAsyncEntity(): Promise<Record<string, any>> {
        const raw = this.buildRawEntityObject();
        await this.runEntityHooks(BEFORE_TO_ENTITY, raw, true);
        // @ts-ignore
        const propertiesConfigs = this.constructor.propertiesConfigs as Record<string, any>;
        const result: Record<string, any> = {};
        for (const [propName] of Object.entries(this)) {
            let propertyName = propName;
            let value = (this as any)[propName];
            if (typeof value === 'function') continue;
            if (value === undefined) continue;
            // @ts-ignore
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
            if (value === undefined || value === null) value = null;
            result[propertyName] = value;
        }
        await this.runEntityHooks(AFTER_TO_ENTITY, result, true);
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

const BEFORE_TO_ENTITY = Symbol('beforeToEntity');
const AFTER_TO_ENTITY = Symbol('afterToEntity');

const assertEntityDecoratorTarget = (target: any, decoratorName: string) => {
    if (!Entity.prototype.isPrototypeOf(target)) {
        throw new Error(`${decoratorName} can only be used on Entity classes`);
    }
}

export function BeforeToEntity(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol) {
        assertEntityDecoratorTarget(target, 'BeforeToEntity');
        const cls = target.constructor as any;
        cls[BEFORE_TO_ENTITY] = cls[BEFORE_TO_ENTITY] || [];
        cls[BEFORE_TO_ENTITY].push(propertyKey);
    };
}

export function AfterToEntity(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol) {
        assertEntityDecoratorTarget(target, 'AfterToEntity');
        const cls = target.constructor as any;
        cls[AFTER_TO_ENTITY] = cls[AFTER_TO_ENTITY] || [];
        cls[AFTER_TO_ENTITY].push(propertyKey);
    };
}
