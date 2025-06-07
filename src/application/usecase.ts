import { Input } from "./controller";

export abstract class UseCase<UseCaseInput, UseCaseOutput, UseCaseContext = any> {
  private readonly data: any;
  private readonly context?: UseCaseContext;

  constructor(input: Input<UseCaseInput>) {
    this.data = input.data;
    if (input.context) {
      this.context = input.context;
    }
  }

  protected getData(): UseCaseInput {
    return this.data;
  }

  protected getContext(): UseCaseContext {
    return this?.context as UseCaseContext;
  }

  abstract execute(): Promise<UseCaseOutput>
}

// export function UseCaseDecorate(
//   useCases: UseCase<any, any> | (new (...args: any[]) => UseCase<any, any>) | Array<UseCase<any, any> | (new (...args: any[]) => UseCase<any, any>)>
// ): ClassDecorator {
//   return function (target: any) {
//     const decorators = Array.isArray(useCases) ? useCases : [useCases];
//     Reflect.defineMetadata(USE_CASE_DECORATORS, decorators, target);
//     return target;
//   };
// }
