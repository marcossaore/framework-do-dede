import { Dede } from '../src/dede';
import { ExampleController } from '../example/express_app/example.controller';

class UserRepository {
  async findById(id: string) {
    return { id, name: 'John Doe' };
  }
}

const port = Number(process.env.PORT || '3001');
const app = await Dede.create({
  framework: { use: 'elysia', port },
  registries: [{ name: 'UserRepository', classLoader: UserRepository }],
});

app.registerControllers([ExampleController]);
app.listen(port);

const shutdown = async () => {
  await app.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
