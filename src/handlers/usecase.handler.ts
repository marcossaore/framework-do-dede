import { Registry } from "@/di/registry";
import type { UseCase } from "@/protocols";

type RequestData = {
  headers: any,
  data?: any,
  middlewareData?: any
}


export class UseCaseHandler {
  static load<T extends UseCase<any, any>>(
    useCaseClass: new (...args: any[]) => T,
    request?: RequestData
  ): T {
    const instance = Registry.classLoader(useCaseClass);
    const auth = Reflect.getMetadata("auth", useCaseClass);
    const context = request
    if (auth && context?.middlewareData) {
      (instance as any)[auth] = context.middlewareData[auth]
    }
    return instance
  }
}