import { Dede } from "../../src/dede";
import { ExampleController } from '../express_app/example.controller';

class UserRepository {
    async findById(id: string) {
        return {
            id,
            name: 'John Doe'
        }
    }
}

let expressApp: any = null;
let elysiaApp: any = null;

async function bootstrap() {
    expressApp = await Dede.create({
        framework: {
            use: 'express',
            port: 3000,
        },
        registries: [
            {
                name: 'UserRepository',
                classLoader: UserRepository,
            }
        ],
    });
    expressApp.registerControllers([ExampleController]);
    expressApp.listen();
    console.log('Express server running on port 3000');

    elysiaApp = await Dede.create({
        framework: {
            use: 'elysia',
            port: 3001,
        },
        registries: [
            {
                name: 'UserRepository',
                classLoader: UserRepository,
            }
        ],
    });
    elysiaApp.registerControllers([ExampleController]);
    elysiaApp.listen();
    console.log('Elysia server running on port 3001');
}

await bootstrap();

export { expressApp, elysiaApp };
