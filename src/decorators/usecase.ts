export function Auth(metadataKey: string): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol): void {
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    Reflect.defineMetadata(
      metadataKey,
      type,
      target.constructor
    );
  };
}