import { USE_CASE_DECORATORS } from "@/decorators/usecase";
import { Registry } from "@/di/registry";
import { Request, UseCase } from "@/protocols";

export default class UseCaseHandler {
    static load<T extends UseCase<any, any>>(
        useCaseClass: new (...args: any[]) => T,
        request?: Request
    ): T {
        const useCaseDecorators = Reflect.getMetadata(USE_CASE_DECORATORS, useCaseClass) || [];
        const useCaseDecoratorsInstances: UseCase<any, any>[] = [];

        // Processa decorators
        for (const useCaseDecorator of useCaseDecorators) {
            let instance: UseCase<any, any>;

            if (typeof useCaseDecorator === 'function') {
                // Cria instância via DI
                instance = Registry.classLoader(useCaseDecorator);
            } else {
                // Usa instância existente
                instance = useCaseDecorator;
            }

            // Injeta contexto na instância (seja nova ou existente)
            injectContext(instance, request);
            useCaseDecoratorsInstances.push(instance);
        }

        // Cria e configura a instância principal
        const instance = Registry.classLoader(useCaseClass);
        injectContext(instance, request);

        // Decora o método execute
        const originalExecute = instance.execute.bind(instance);
        instance.execute = async (input: any) => {
            for (const decoratorInstance of useCaseDecoratorsInstances) {
                await decoratorInstance.execute(input);
            }
            return originalExecute(input);
        };

        return instance;
    }
}

function injectContext(instance: any, request?: Request) {
  const contextMetadata: Array<{ propertyKey: string, middlewareKey: string }> = 
    Reflect.getMetadata('context', instance.constructor) || [];
  
  contextMetadata.forEach(({ propertyKey, middlewareKey }) => {
    if (request?.middlewareData?.[middlewareKey]) {
      instance[propertyKey] = request.middlewareData[middlewareKey];
    }
  });
}