import { Dede } from "../../src/dede";
import '../express_app/example.controller';

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
    expressApp = await Dede.start({
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
    console.log('Express server running on port 3000');

    elysiaApp = await Dede.start({
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
    console.log('Elysia server running on port 3001');
}

await bootstrap();

export { expressApp, elysiaApp };