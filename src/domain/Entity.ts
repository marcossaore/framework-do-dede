import { ExposeConfig } from "@/decorators/entity";

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
        await this.beforeSave();
        const result: Record<string, any> = {};
        const processedKeys = new Set<string>();

        const dbColumns = (this.constructor as any)._dbColumns as Set<{
            property: string;
            mapping: string | Record<string, string>;
        }>;

        if (dbColumns) {
            for (const { property, mapping } of dbColumns) {
                const value = (this as any)[property];

                if (value === undefined) continue;

                processedKeys.add(property);

                if (typeof mapping === 'string') {
                    result[mapping] = value;
                } else {
                    for (const [subProp, column] of Object.entries(mapping)) {
                        const subValue = value[subProp];
                        if (subValue !== undefined) {
                            result[column] = subValue;
                        }
                    }
                }
            }
        }

        for (const [key, value] of Object.entries(this)) {
            if (!processedKeys.has(key) && value !== undefined) {
                result[key] = value;
            }
        }

        return result;
    }

    public async toMap(properties: string[]): Promise<Record<string, any>> {
        const ctor = this.constructor as any;
        const exposeConfigs = ctor._exposeConfigs || new Map<string, ExposeConfig[]>();
        const attributes: Record<string, any> = {};
        for (const property of properties) {
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

    protected async beforeSave() { }
}