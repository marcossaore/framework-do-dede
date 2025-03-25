
export abstract class Entity {

    public attributes (): Record<string, any> {
        const ctor = this.constructor as any;
        const restrictedProps = ctor._restrictedProperties || new Set();
        return Object.fromEntries(
            Object.entries(this).filter(([key]) => !restrictedProps.has(key))
        );
    }

    public toSave (): Record<string, any> {
        return Object.fromEntries(
            Object.entries(this).filter(([,value]) => value != undefined)
        )
    }
}