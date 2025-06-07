import { UseCase } from "@/protocols";

export const USE_CASE_DECORATORS = Symbol('useCaseDecorators');

export interface UseCase<Input, Output>  {
  execute(input: Input): Promise<Output>
}

export function UseCaseContext(middlewareKey: string) {
  return function (target: any, propertyKey: string) {
    const metadata = Reflect.getMetadata('context', target.constructor) || [];
    metadata.push({ propertyKey, middlewareKey });
    Reflect.defineMetadata('context', metadata, target.constructor);
  };
}

export function UseCaseDecorate(
   useCases: UseCase<any, any> | (new (...args: any[]) => UseCase<any, any>) | Array<UseCase<any, any> | (new (...args: any[]) => UseCase<any, any>)>
): ClassDecorator {
  return function (target: any) {
    const decorators = Array.isArray(useCases) ? useCases : [useCases];
    Reflect.defineMetadata(USE_CASE_DECORATORS, decorators, target);
    return target;
  };
}
