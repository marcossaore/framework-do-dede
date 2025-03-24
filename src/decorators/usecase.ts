export function Auth(propertyName: string = 'auth'): Function {
  return function (target: any, propertyKey: string): void {
    Reflect.defineMetadata(
      "auth",
      propertyName,
      target.constructor
    );
  };
}