import { HttpServer } from "./http";
import ControllerHandler from "./http/controller.handler";
import { ElysiaServerAdapter } from "./http/elysia-server.adapter";
import { ExpressServerAdapter } from "./http/express-server.adapter";
import { Registry } from "./infra/di/registry";

export type Register = {
    name: string,
    classLoader: any,
}

export type Options = {
    framework: {
        use: 'elysia' | 'express',
        port?: number,
        middlewares?: CallableFunction[]
    },
    registries: Register[],
    defaultServerError?: string
}

export class Dede {

    private readonly httpServer!: HttpServer;

    private constructor(
        private readonly framework: {
            use: 'elysia' | 'express',
            port?: number,
            middlewares?: CallableFunction[]
        },
        private readonly defaultServerError?: string
    ) {
        if (framework.use === 'elysia') {
            this.httpServer = new ElysiaServerAdapter(framework.middlewares || [])
        }
        if (framework.use === 'express') {
            this.httpServer = new ExpressServerAdapter(framework.middlewares || [])
        }
        if (defaultServerError) this.httpServer.setDefaultMessageError(defaultServerError)
        new ControllerHandler(this.httpServer, framework.port || 80);
    }

    static async start ({ framework, registries, defaultServerError }: Options): Promise<Dede> {
        await this.loadRegistries(registries);
        return new Dede(framework, defaultServerError)
    }

    async stop() {
        await this.httpServer.close()
    }

    private static async loadRegistries(registries: Register []) {
        registries.forEach(({ classLoader, name }) => {
            Registry.load(name, classLoader);
        })
        return new Promise(resolve => setTimeout(resolve, 500))
    }
}