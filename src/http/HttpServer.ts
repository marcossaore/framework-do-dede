import { FrameworkError } from "./FrameworkError"

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
    private defaultMessageError: string | undefined;

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

    setDefaultMessageError(message: string): void {
        this.defaultMessageError = message
    }

    getDefaultMessageError(): string | undefined {
        return this.defaultMessageError
    }

    listen(port: number): void {
        this.framework.listen(port)
    }

    abstract close(): Promise<void>

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

    private elysia(httpServerParams: HttpServerParams, route: string, handler: CallableFunction) {
        const method = httpServerParams.method as AllowedMethods
        (this.framework[method])(route, async ({ headers, set, query, params, body, request }: any) => {
            headers['ip'] = (this.framework as any).server?.requestIP(request).address
            set.status = httpServerParams.statusCode ?? 200
            const output = await handler({
                setStatus: (statusCode: HttpStatusCode) => set.status = statusCode,
                headers,
                query,
                params,
                body
            })
            return output
        })
    }

    private express(httpServerParams: HttpServerParams, route: string, handler: CallableFunction) {
        const method = httpServerParams.method as AllowedMethods
        this.framework[method](route, async (request: any, res: any) => {
            request.headers['ip'] = request.ipç
            res.status(httpServerParams.statusCode ?? 200)
            const output = await handler({
                setStatus: (statusCode: HttpStatusCode) => res.status(statusCode),
                headers: request.headers,
                query: request.query,
                params: request.params,
                body: method !== 'get' ? request.body : {}
            })
            return res.json(output)
        })
    }
}