export function Auth(middlewareKey: string) {
  return function (target: any, propertyKey: string) {
    const metadata = Reflect.getMetadata('auth', target.constructor) || [];
    metadata.push({ propertyKey, middlewareKey });
    Reflect.defineMetadata('auth', metadata, target.constructor);
  };
}