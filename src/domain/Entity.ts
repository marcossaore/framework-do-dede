
export abstract class Entity {

    public attributes (): Record<string, any> {
        const ctor = this.constructor as any;
        const restrictedProps = ctor._restrictedProperties || new Set();
        return Object.fromEntries(
            Object.entries(this).filter(([key]) => !restrictedProps.has(key))
        );
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

    public beforeSave() {}
}