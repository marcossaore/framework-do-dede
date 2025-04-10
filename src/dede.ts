import { Registry } from "./di/registry";
import { ControllerHandler } from "./handlers";
import { HttpServer } from "./http";
import { ElysiaHttpServer } from "./http/ElysiaHttpServer";
import { ExpressHttpServer } from "./http/ExpressHttpServer";

export type Register = {
    name: string,
    classLoader: any,
    autoLoad?: boolean
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
    static async init ({ framework, registries, defaultServerError }: Options): Promise<void> {
        await this.loadRegistries(registries);
        let httpServer!: HttpServer
        if (framework.use === 'elysia') {
            httpServer = new ElysiaHttpServer(framework.middlewares || [])
        }
        if (framework.use === 'express') {
            httpServer = new ExpressHttpServer(framework.middlewares || [])
        }
        if (defaultServerError) httpServer.setDefaultMessageError(defaultServerError)
        if(Registry.has('controllers')){
            new ControllerHandler(httpServer, framework.port || 80)
            this.clearControllers()
        }
    }

    private static clearControllers() {
        Registry.clear('controllers');
    }

    private static async loadRegistries(registries: Register []) {
        registries.forEach(({ classLoader, name, autoLoad = true}) => {
            if (autoLoad) Registry.register(name, Registry.classLoader(classLoader));
            else Registry.register(name, classLoader);
        })
    }
}