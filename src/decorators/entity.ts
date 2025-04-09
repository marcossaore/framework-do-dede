export function Restrict() {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._restrictedProperties) {
            target.constructor._restrictedProperties = new Set();
        }
        target.constructor._restrictedProperties.add(propertyKey);
    };
}

export function DbColumn(mapping: string | Record<string, string>) {
    return function (target: Object, propertyKey: string) {
        const ctor = target.constructor as any;

        if (!Object.prototype.hasOwnProperty.call(ctor, '_dbColumns')) {
            ctor._dbColumns = new Set();
        }

        ctor._dbColumns.add({
            property: propertyKey,
            mapping: mapping
        });
    };
}