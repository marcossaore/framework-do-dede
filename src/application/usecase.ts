import { Input } from "./controller";

export const USE_CASE_DECORATORS = Symbol('USE_CASE_DECORATORS');

export abstract class UseCase<UseCaseInput, UseCaseOutput, UseCaseContext = any> {
  protected readonly data?: UseCaseInput | Record<string, any>;
  protected readonly context?: UseCaseContext;

  protected constructor(input?: Input<UseCaseInput>) {
    this.data = input?.data || {};
    if (input?.context) {
      this.context = input.context;
    }
  }

  abstract execute(): Promise<UseCaseOutput>
}

export function DecorateUseCase(
  useCases: UseCase<any, any> | (new (...args: any[]) => UseCase<any, any>) | Array<UseCase<any, any> | (new (...args: any[]) => UseCase<any, any>)>
): ClassDecorator {
  return function (target: any) {
    const decorators = Array.isArray(useCases) ? useCases : [useCases];
    Reflect.defineMetadata(USE_CASE_DECORATORS, decorators, target);
    return target;
  };
}
