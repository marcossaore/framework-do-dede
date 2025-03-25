export function Restrict() {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._restrictedProperties) {
            target.constructor._restrictedProperties = new Set();
        }
        target.constructor._restrictedProperties.add(propertyKey);
    };
}
