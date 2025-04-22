export function Context(middlewareKey: string) {
  return function (target: any, propertyKey: string) {
    const metadata = Reflect.getMetadata('context', target.constructor) || [];
    metadata.push({ propertyKey, middlewareKey });
    Reflect.defineMetadata('context', metadata, target.constructor);
  };
}