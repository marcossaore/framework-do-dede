export function Auth(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol): void {
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    Reflect.defineMetadata('propertyType', type, target.constructor);
  };
}