import { HttpServer } from "./http";
import ControllerHandler from "./http/controller.handler";
import { ElysiaServerAdapter } from "./http/elysia-server.adapter";
import { ExpressServerAdapter } from "./http/express-server.adapter";
import { Container, DefaultContainer, setDefaultContainer } from "./infra/di/registry";

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
    controllers?: any[],
    registries: Register[],
    defaultServerError?: string,
    container?: Container
}

export class Dede {

    private readonly httpServer!: HttpServer;
    private readonly port?: number;
    private controllersRegistered = false;

    private constructor(
        private readonly framework: {
            use: 'elysia' | 'express',
            port?: number,
            middlewares?: CallableFunction[]
        },
        private readonly defaultServerError?: string,
        private readonly container: Container = DefaultContainer
    ) {
        this.port = framework.port;
        if (framework.use === 'elysia') {
            this.httpServer = new ElysiaServerAdapter(framework.middlewares || [])
        }
        if (framework.use === 'express') {
            this.httpServer = new ExpressServerAdapter(framework.middlewares || [])
        }
        if (defaultServerError) this.httpServer.setDefaultMessageError(defaultServerError)
    }

    static async create ({ framework, registries, defaultServerError, container }: Options): Promise<Dede> {
        const appContainer = container ?? new Container();
        setDefaultContainer(appContainer);
        await this.loadRegistries(appContainer, registries);
        return new Dede(framework, defaultServerError, appContainer)
    }

    static async start ({ framework, registries, defaultServerError, container, controllers }: Options): Promise<Dede> {
        const app = await Dede.create({ framework, registries, defaultServerError, container, controllers });
        if (controllers && controllers.length > 0) {
            app.registerControllers(controllers);
        }
        app.listen();
        return app;
    }

    async stop() {
        await this.httpServer.close()
    }

    registerControllers(controllers: any[]) {
        if (this.controllersRegistered) return;
        new ControllerHandler(this.httpServer, controllers);
        this.controllersRegistered = true;
    }

    listen(port?: number) {
        const resolvedPort = port ?? this.port ?? 80;
        this.httpServer.listen(resolvedPort);
    }

    private static async loadRegistries(container: Container, registries: Register []) {
        registries.forEach(({ classLoader, name }) => {
            container.load(name, classLoader);
        })
    }
}
