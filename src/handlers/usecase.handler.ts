import { USE_CASE_DECORATORS } from "@/decorators/usecase";
import { Registry } from "@/di/registry";
import { Request, UseCase } from "@/protocols";

export default class UseCaseHandler {
    static load<T extends UseCase<any, any>>(
        useCaseClass: new (...args: any[]) => T,
        request?: Request
    ): T {
        const instance = Registry.classLoader(useCaseClass);
        const useCaseDecorators = Reflect.getMetadata(USE_CASE_DECORATORS, useCaseClass) || [];
        const useCaseDecoratorsInstances: UseCase<any, any>[] = []
        for (const useCaseDecorator of useCaseDecorators) {
            if (typeof useCaseDecorator === 'function') {
                useCaseDecoratorsInstances.push(Registry.classLoader(useCaseDecorator));
            } else {
                useCaseDecoratorsInstances.push(useCaseDecorator);
            }
        }
        const context = request;
        const contextMetadata: Array<{ propertyKey: string, middlewareKey: string }> =
            Reflect.getMetadata('context', useCaseClass) || [];
        contextMetadata.forEach(({ propertyKey, middlewareKey }) => {
            if (context?.middlewareData?.[middlewareKey]) {
                (instance as any)[propertyKey] = context.middlewareData[middlewareKey];
                for (let index = 0; index < useCaseDecoratorsInstances.length; index++) {
                    (useCaseDecoratorsInstances[index] as any)[propertyKey] = context.middlewareData[middlewareKey];
                }
            }
        });

        const originalExecute = instance.execute.bind(instance);

        instance.execute = async (input: any) => {
            for await (const useCaseDecoratorsInstance of useCaseDecoratorsInstances) {
                await useCaseDecoratorsInstance.execute(input);
            }
            return originalExecute(input);
        }
        return instance;
    }
}