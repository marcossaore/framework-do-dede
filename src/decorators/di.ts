export function Inject(token: string) {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number): void {
        const injections = Reflect.getMetadata('injections', target) || [];
        injections[parameterIndex] = token;
        Reflect.defineMetadata('injections', injections, target);
    };
}