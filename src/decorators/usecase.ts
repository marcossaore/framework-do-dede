export function Auth(propertyName: string = 'auth') {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(
      "auth",
      propertyName,
      target.constructor
    );
  };
}