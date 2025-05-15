import { UseCase } from "@/protocols";

export const USE_CASE_DECORATORS = Symbol('useCaseDecorators');

export function Context(middlewareKey: string) {
  return function (target: any, propertyKey: string) {
    const metadata = Reflect.getMetadata('context', target.constructor) || [];
    metadata.push({ propertyKey, middlewareKey });
    Reflect.defineMetadata('context', metadata, target.constructor);
  };
}

export function DecorateUseCase(
   useCases: (new (...args: any[]) => UseCase<any, any> | UseCase<any, any>) | 
  Array<new (...args: any[]) => UseCase<any, any> | UseCase<any, any>>
): ClassDecorator {
  return function (target: any) {
    const decorators = Array.isArray(useCases) ? useCases : [useCases];
    Reflect.defineMetadata(USE_CASE_DECORATORS, decorators, target);
    return target;
  };
}
