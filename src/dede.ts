import { HttpServer } from "./http";
import ControllerHandler from "./http/controller.handler";
import { ElysiaServerAdapter } from "./http/elysia-server.adapter";
import { ExpressServerAdapter } from "./http/express-server.adapter";
import { Container, DefaultContainer, setDefaultContainer } from "./infra/di/registry";
import { FrameworkError } from "./http/errors/framework";

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
    container?: Container,
    prefix?: string,
    version?: number
}

export class Dede {

    private readonly httpServer!: HttpServer;
    private readonly port?: number;
    private controllersRegistered = false;
    private readonly prefix?: string;
    private readonly version?: number;

    private constructor(
        private readonly framework: {
            use: 'elysia' | 'express',
            port?: number,
            middlewares?: CallableFunction[]
        },
        private readonly defaultServerError?: string,
        private readonly container: Container = DefaultContainer,
        prefix?: string,
        version?: number
    ) {
        this.port = framework.port;
        this.prefix = normalizePrefix(prefix);
        this.version = version;
        if (framework.use === 'elysia') {
            this.httpServer = new ElysiaServerAdapter(framework.middlewares || [])
        }
        if (framework.use === 'express') {
            this.httpServer = new ExpressServerAdapter(framework.middlewares || [])
        }
        if (defaultServerError) this.httpServer.setDefaultMessageError(defaultServerError)
    }

    static async create ({ framework, registries, defaultServerError, container, prefix, version }: Options): Promise<Dede> {
        assertValidVersion(version);
        const appContainer = container ?? new Container();
        setDefaultContainer(appContainer);
        await this.loadRegistries(appContainer, registries);
        return new Dede(framework, defaultServerError, appContainer, prefix, version)
    }

    static async start ({ framework, registries, defaultServerError, container, controllers, prefix, version }: Options): Promise<Dede> {
        const app = await Dede.create({ framework, registries, defaultServerError, container, controllers, prefix, version });
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
        new ControllerHandler(this.httpServer, controllers, { prefix: this.prefix, version: this.version });
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

function assertValidVersion(version?: number) {
    if (version === undefined) return;
    if (!Number.isInteger(version) || version <= 0) {
        throw new FrameworkError('Version must be a positive integer');
    }
}

function normalizePrefix(prefix?: string) {
    if (!prefix) return undefined;
    const trimmed = prefix.trim();
    if (!trimmed) return undefined;
    if (trimmed === '/') return '/';
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}
