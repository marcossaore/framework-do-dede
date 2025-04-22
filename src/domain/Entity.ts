
export abstract class Entity {

    public attributes (): Record<string, any> {
        const ctor = this.constructor as any;
        const restrictedProps = ctor._restrictedProperties || new Set();
        const exposedProps = ctor._exposedProperties || new Map();
        const attributes: Record<string, any> = {};

        for (const [key, value] of Object.entries(this)) {
            if (!restrictedProps.has(key)) {
                attributes[key] = value;
            }
        }

        for (const [propName, methodName] of exposedProps) {
            // @ts-ignore
            if (!restrictedProps.has(propName) && typeof this[methodName] === "function") {
                // @ts-ignore
                attributes[propName] = this[methodName]();
            }
        }

        return attributes;
    }

    public toSave(): Record<string, any> {
        this.beforeSave();
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

    protected beforeSave() {}
}