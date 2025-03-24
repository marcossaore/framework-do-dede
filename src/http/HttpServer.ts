import { FrameworkError } from "./FrameworkError"
import { ServerError } from "./ServerError"

export type HttpStatusCode = 200 | 201 | 204 | 401 | 403 | 404 | 409 | 422 | 500

export type AllowedMethods = 'get' | 'post' | 'put' | 'delete' | 'patch'

export type HttpServerParams = {
    method: AllowedMethods,
    route: string,
    statusCode?: number,
    params?: string[],
    query?: string[]
}

type FrameworkWeb = {
    listen(port: number): void;
    use(middleware: CallableFunction): void
    get(route: string, handler: CallableFunction): void
    post(route: string, handler: CallableFunction): void
    put(route: string, handler: CallableFunction): void
    delete(route: string, handler: CallableFunction): void
    patch(route: string, handler: CallableFunction): void
}

export default abstract class HttpServer {
    protected framework: FrameworkWeb
    protected frameworkName: string;
    protected defaultMessageError = 'Ops, An unexpected error occurred';

    constructor(framework: FrameworkWeb, frameworkName: 'elysia' | 'express') {
        if (frameworkName !== 'elysia' && frameworkName !== 'express') throw new FrameworkError('Framework not supported')
        this.framework = framework
        this.frameworkName = frameworkName
    }

    use(middleware: CallableFunction): HttpServer {
        this.framework.use(middleware)
        return this;
    }

    register(httpServerParams: HttpServerParams, handler: CallableFunction): void {
        const route = this.mountRoute(httpServerParams)
        if (this.frameworkName === 'elysia') return this.elysia(httpServerParams, route, handler)
        return this.express(httpServerParams, route, handler)
    }

    listen(port: number): void {
        this.framework.listen(port)
    }

    private mountRoute(httpServerParams: HttpServerParams) {
        const params = httpServerParams.params?.map((param) => param.split('|')[0])
        if (params && params.length > 0) {
            const paramsMounted = params.map((v) => {
                return v.includes('_') ? `${v.replace('_', '/')}` : `/:${v}`
            }).join('')
            return `${httpServerParams.route}${paramsMounted}`
        }
        return httpServerParams.route
    }

    private elysia (httpServerParams: HttpServerParams, route: string, handler: CallableFunction) {
        const method = httpServerParams.method as AllowedMethods
        (this.framework[method])(route, async ({ headers, set, query, params, body, request, path }: any) => {
            try {
                set.status = httpServerParams.statusCode ?? 200
                const output = await handler({
                  headers,
                  query,
                  params,
                  body
                })
                return output
              } catch (error: any) {
                if (error instanceof ServerError) {
                  set.status = error.getStatusCode()
                  return {
                    error: error.message,
                    statusCode: error.getStatusCode()
                  }
                }
                set.status = 500
                return {
                  error: this.defaultMessageError,
                  statusCode: 500
                }
              }
        })
    }

    private express (httpServerParams: HttpServerParams, route: string, handler: CallableFunction) {
        const method = httpServerParams.method as AllowedMethods
        this.framework[method](route, async (request: any, res: any) => {
            try {
                const output = await handler({
                    headers: request.headers,
                    query: request.query,
                    params: request.params,
                    body: request.body
                })
                return res.status(httpServerParams.statusCode ?? 200).json(output)
            } catch (error: any) {
                if (error instanceof ServerError) {
                    return res.status(error.getStatusCode()).json({
                        error: error.message,
                        statusCode: error.getStatusCode()
                    })
                }
                return res.status(500).json({
                    error: this.defaultMessageError,
                    statusCode: 500
                })
            }
        })
    }
}