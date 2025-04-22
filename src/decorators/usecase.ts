export function Auth(middlewareKey: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('auth', middlewareKey, target, propertyKey);
  };
}