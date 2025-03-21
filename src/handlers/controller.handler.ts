import HttpServer from "@/http/HttpServer"
import type { Controller } from "@/protocols/Controller"
import { Registry } from "@/di/registry"

type Input = {
    headers: any
    body: any
    params: any
    query: any
}

export default class ControllerHandler {
    constructor(httpServer: HttpServer, port: number) {
        for (const { instance, instanceMethod, middlewares,  method, route, statusCode, params, query, validation } of this.registryControllers()) {
            httpServer.register(
                {
                    method,
                    route,
                    statusCode,
                    params,
                    query
                },
                async (input: Input) => {
                    const filterParams = this.filter(input.params, params)
                    const queryParams = this.filter(input.query, query)
                    let mergedParams = { ...filterParams, ...queryParams, ...(input.body || {}) }
                    if (validation) mergedParams = validation.validate({ ...filterParams, ...queryParams, ...(input.body || {}) });
                    let middlewareData = {}
                    if (middlewares) {
                        for (const middleware of middlewares) {
                            const  middlewareResult = await middleware.execute({ headers: input.headers,  ...mergedParams })
                            middlewareData = { ...middlewareResult, ...middlewareData }
                        }
                    }
                    const request = { headers: input.headers, data: mergedParams, middlewareData }
                    return await instance[instanceMethod](mergedParams, request)
                }
            )
        }
        httpServer.listen(port)
    }

    private registryControllers() {
        const registryControllers = Registry.resolve<any[]>('controllers');
        const controllers: Controller[] = []
        for (const controller of registryControllers) {
            const basePath = Reflect.getMetadata('basePath', controller);
            const injections = Reflect.getMetadata('injections', controller) || [];
            const args = injections.map((token: string) => Registry.resolve(token))
            const instance = new controller(...args)
            const methodNames = Object.getOwnPropertyNames(controller.prototype).filter(method => method !== 'constructor')
            for (const methodName of methodNames) {
                const validation = Reflect.getMetadata('validation', controller.prototype, methodName);
                const routeConfig = Reflect.getMetadata('route', controller.prototype, methodName);
                const middlewares = Reflect.getMetadata('middlewares', controller.prototype, methodName);
                controllers.push({
                    method: routeConfig.method,
                    route: basePath + routeConfig.path,
                    params: routeConfig.params,
                    query: routeConfig.query,
                    statusCode: routeConfig.statusCode,
                    instance,
                    instanceMethod: methodName,
                    middlewares,
                    validation
                });
            }
        }
        return controllers
    }

    private filter(params: any, filterParams?: string[]): any {
        const filter: any = {}
        for (const paramName of filterParams || []) {
            const [paramNameFiltered, type] = paramName.split('|')
            let value = params[paramName] || params[paramNameFiltered]
            if (!value) return
            if (type === 'boolean') value = value === 'true'
            if (type === 'integer') {
                value = value.replace(/[^0-9]/g, '')
                value = value ? parseInt(value) : 0
            }
            if (type === 'string') value = value.toString()
            filter[paramNameFiltered] = value
        }
        return filter
    }
}
