import { DbColumnConfig, ExposeConfig } from "@/decorators/entity";

export abstract class Entity {

    public async get(): Promise<Record<string, any>> {
        const ctor = this.constructor as any;
        const restrictedProps = ctor._restrictedProperties || new Set();
        const virtualProperties = ctor._virtualProperties || new Map();
        const exposeConfigs = ctor._exposeConfigs || new Map<string, ExposeConfig[]>();
        const attributes: Record<string, any> = {};

        for (const [key, value] of Object.entries(this)) {
            if (!restrictedProps.has(key)) {
                attributes[key] = value;
            }
        }

        for await (const [propName, methodName] of virtualProperties) {
            // @ts-ignore
            if (!restrictedProps.has(propName) && typeof this[methodName] === "function") {
                // @ts-ignore
                attributes[propName] = await this[methodName]();
            }
        }

        for (const [propertyKey, configs] of exposeConfigs) {
            if (restrictedProps.has(propertyKey)) continue;
            const rawValue = (this as any)[propertyKey];
            for (const config of configs) {
                try {
                    let value = config.deserialize ? await config.deserialize(rawValue) : rawValue;

                    if (config.mapping) {
                        if (typeof config.mapping === "string") {
                            attributes[config.mapping] = value;
                        } else {
                            Object.entries(config.mapping).forEach(([srcKey, destKey]) => {
                                // @ts-ignore
                                attributes[destKey] = value[srcKey];
                            });
                        }
                    } else {
                        if (typeof value === "object" && value !== null) {
                            Object.assign(attributes, value);
                        } else {
                            attributes[propertyKey as string] = value;
                        }
                    }
                } catch (error) {
                    console.error(`Error in @Expose for ${String(propertyKey)}:`, error);
                }
            }
        }

        return attributes;
    }

    public async toEntity(): Promise<Record<string, any>> {
        const ctor = this.constructor as any;
        const dbColumnConfigs = ctor._dbColumnConfigs || new Map<string | symbol, DbColumnConfig<any>[]>();
        const dbRecord: Record<string, any> = {};

        for (const [key, value] of Object.entries(this)) {
            dbRecord[key] = value;
        }

        for (const [propertyKey, configs] of dbColumnConfigs) {
            const rawValue = (this as any)[propertyKey];

            for (const config of configs) {
                try {
                    let serializedValue = config.serialize ? await config.serialize(rawValue) : rawValue;

                    if (!serializedValue) continue;

                    if (config.column) {
                        if (typeof config.column === "string") {
                            dbRecord[config.column] = serializedValue;
                        } else {
                            for (const [srcKey, destKey] of Object.entries(config.column)) {
                                dbRecord[destKey as string] = serializedValue[srcKey];
                            }
                        }
                    } else {
                        dbRecord[propertyKey as string] = serializedValue;
                    }
                } catch (error) {
                    console.error(`Error in @DbColumn for ${String(propertyKey)}:`, error);
                }
            }
        }
        return dbRecord;
    }

    public async toMap(properties: string[]): Promise<Record<string, any>> {
        const ctor = this.constructor as any;
        const exposeConfigs = ctor._exposeConfigs || new Map<string, ExposeConfig[]>();
        const attributes: Record<string, any> = {};
        for (const property of properties) {
            const rawValue = (this as any)[property];
            if (!rawValue) continue;
            attributes[property] = rawValue;
            if (exposeConfigs.has(property)) {
                const rawValue = (this as any)[property];
                const config = exposeConfigs.get(property);
                try {
                    let value = config.deserialize ? await config.deserialize(rawValue) : rawValue;

                    if (config.mapping) {
                        if (typeof config.mapping === "string") {
                            attributes[config.mapping] = value;
                        } else {
                            Object.entries(config.mapping).forEach(([srcKey, destKey]) => {
                                // @ts-ignore
                                attributes[destKey] = value[srcKey];
                            });
                        }
                    } else {
                        if (typeof value === "object" && value !== null) {
                            Object.assign(attributes, value);
                        } else {
                            attributes[property as string] = value;
                        }
                    }
                } catch (error) {
                    console.error(`Error in @Expose for ${String(property)}:`, error);
                }
            }
        }
        return attributes;
    }
}