export function Auth(): Function {
  return function (target: any, propertyKey: string): void {
    Reflect.defineMetadata(
      "auth",
      "auth",
      target.constructor
    );
  };
}