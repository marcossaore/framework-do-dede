# Framework do Dedé

Um framework TypeScript simples para construir APIs HTTP com controllers, use cases e entities, com suporte a Express ou Elysia, DI leve e camada de Model.

## Índice

- Instalação
- Quickstart
- Conceitos
  - Controllers e Rotas
  - Input, params e filtros
  - Middlewares
  - Tracing
  - UseCase e Decorators
  - Entity e Model
  - Event Dispatcher
  - Storage Gateway
  - DI (Container/Inject)
  - Errors
  - Protocolos de Repositório
- Exemplos
  - Express
  - Elysia
  - Background com EventDispatcher
- Testes
- Benchmark

## Instalação

```bash
bun install
```

Para executar o exemplo (Express e Elysia):

```bash
bun run example/express_app/server.ts
```

## Quickstart

```ts
import { Controller, Get, Post, UseCase, Dede } from './src';

@Controller('/hello')
class HelloController {
  @Get({ statusCode: 200 })
  async get() {
    const useCase = new HelloUseCase({ data: undefined });
    return await useCase.execute();
  }

  @Post({ statusCode: 201, body: ['name|string'] })
  async post(request: { data: { name: string } }) {
    const useCase = new HelloUseCase({ data: request.data });
    return await useCase.execute();
  }
}

class HelloUseCase extends UseCase<{ name?: string }, { message: string }> {
  async execute() {
    return { message: `Hello ${this.data?.name ?? 'world'}` };
  }
}

const app = await Dede.create({
  framework: { use: 'express', port: 3000 },
  registries: []
});
app.registerControllers([HelloController]);
app.listen();
```

## Conceitos

### Controllers e Rotas

Use decorators para expor métodos como rotas HTTP. O Controller define metadados, e o ControllerHandler monta as rotas em runtime a partir da lista de controllers passada ao `app.registerControllers(...)`.

```ts
import { Controller, Get, Post, Put, Delete, Patch } from './src';

@Controller('/users')
export class UsersController {
  @Get({ statusCode: 200 })
  async list() { /* ... */ }

  @Post({ statusCode: 201, body: ['name|string', 'email|string'] })
  async create(request: { data: any }) { /* ... */ }

  @Put({ params: ['id|string'], body: ['name|string'] })
  async update(request: { data: any }) { /* ... */ }

  @Delete({ params: ['id|string'] })
  async remove(request: { data: any }) { /* ... */ }
}
```

Decorators disponíveis:

- `@Controller(basePath?: string)`
- `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`

Opções de rota (comuns):

- `path`: string
- `statusCode`: number
- `params`, `query`, `headers`, `body`: array de strings no formato `campo|tipo`
- `bodyFilter`: `"restrict" | "none"`
- `responseType`: `"json" | "text" | "html"`
- `validator`: pode ser uma classe com decorators do `class-validator` **ou** um objeto com `validate(data)` (sync/async)

### Input, params e filtros

O framework compõe um objeto `request.data` a partir de:

1) headers filtrados
2) params filtrados
3) query filtrada
4) body filtrado

Quando `bodyFilter: "restrict"`, apenas os campos definidos em `body` serão usados. Caso contrário, o corpo completo é mesclado.

Tipos suportados no filtro:

- `boolean`, `integer`, `string`, `number`

Exemplos:

```ts
@Put({
  params: ['id|string'],
  query: ['active|boolean'],
  headers: ['x-type|string'],
  body: ['name|string'],
  bodyFilter: 'restrict',
  validator: CreateUserDto
})
async update(request: { data: any }) {
  // request.data: { id, active, 'x-type', name }
}
```

```ts
import 'reflect-metadata'
import { IsEmail, IsNotEmpty } from 'class-validator'

class CreateUserDto {
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name!: string

  @IsEmail({}, { message: 'Email inválido.' })
  email?: string
}
```

```ts
@Put({
  body: ['name|string', 'email|string'],
  bodyFilter: 'restrict',
  validator: CreateUserDto
})
async update(request: { data: any }) {}
```

Obs: o framework usa `class-validator` como `peerDependency`, então o projeto que consome deve ter a mesma versão instalada.

Suporte a notacao com colchetes:

```json
{ "user[name]": "Joao", "user[email]": "a@b.com" }
```

vira:

```json
{ "user": { "name": "Joao", "email": "a@b.com" } }
```

### Middlewares

Middlewares devem implementar `execute(input: Input<any>)`. Podem ser classe, factory ou instancia.

```ts
import { Middleware, UseMiddleware, UseMiddlewares, Input } from './src';

class AuthMiddleware implements Middleware {
  async execute(input: Input<any>) {
    input.context.auth = { userId: 123 };
  }
}

@Controller('/secure')
class SecureController {
  @Get()
  @UseMiddleware(AuthMiddleware)
  async get(request: { data: any; context: any }) {
    return { userId: request.context.auth.userId };
  }
}
```

### Tracing

Use `@Tracing` no controller ou em um metodo para capturar metadados de request.

```ts
import { Tracing, Tracer, TracerData } from './src';

class ConsoleTracer implements Tracer<void> {
  trace(data: TracerData) {
    console.log(data);
  }
}

@Tracing(new ConsoleTracer())
@Controller('/trace')
class TraceController {
  @Get()
  async get() { return { ok: true }; }
}
```

### UseCase e Decorators

UseCase provê `data` e `context` do request.

```ts
import { UseCase } from './src';

class CreateUserUseCase extends UseCase<{ name: string }, { id: string }> {
  async execute() {
    return { id: 'new-id' };
  }
}
```

Decorator `@DecorateUseCase` permite compor use cases ao redor do método.

```ts
import { UseCase, DecorateUseCase } from './src';

class AuditUseCase extends UseCase<any, void> {
  async execute() { /* audit */ }
}

@DecorateUseCase({ useCase: AuditUseCase })
class CreateUserUseCase extends UseCase<{ name: string }, { id: string }> {
  async execute() { return { id: 'new-id' }; }
}
```

Hooks oferecem uma alternativa simples para acoplar eventos sem depender de `data`/`context` da request. O use case dispara o hook e decide qual payload enviar. Cada use case registra **um HookBefore e/ou um HookAfter**.

```ts
import { UseCase, HookAfter, HookBefore, AfterHook, BeforeHook } from './src';

class SavePhoto extends AfterHook<{ id: string }> {
  async use(payload: { id: string }) {
    // this.notify() é chamado automaticamente após o execute
    console.log('photo saved:', payload.id);
  }
}

class ValidatePhoto extends BeforeHook<{ name: string }> {
  async use(payload: { name: string }) {
    console.log('validating:', payload.name);
  }
}

@HookBefore(ValidatePhoto)
@HookAfter(SavePhoto)
class CreatePhotoUseCase extends UseCase<{ name: string }, { id: string }> {
  async execute() {
    const photo = { id: 'photo-1', name: this.data?.name ?? 'no-name' };
    this.afterHook.use({ id: photo.id });
    return photo;
  }
}
```

Por padrão, `HookBefore` e `HookAfter` recebem `this.data` se nenhum payload for definido manualmente. Apenas `HookAfter` pode ser sobrescrito via `this.afterHook.use(...)`. O `HookBefore` não recebe o retorno do `execute()` por ser um evento before.

`HookAfter` não executa quando o método lança erro. Para executar mesmo em erro:

```ts
@HookAfter(SavePhoto, { runOnError: true })
class CreatePhotoUseCase extends UseCase<void, void> {
  async execute() {
    throw new Error('boom');
  }
}
```

### Entity e Model

Entities sao dominio puro. Use `Model` para mapear coluna/property e construir o objeto de persistencia.

```ts
import { Entity, Model, model, column } from './src';

class Order extends Entity {
  private readonly id: string;
  private readonly name: string;
  private readonly amount: number;

  constructor(id: string, name: string, amount: number) {
    super();
    this.id = id;
    this.name = name;
    this.amount = amount;
    this.generateGetters();
  }
}

type OrderTable = 'orders';

@model<OrderTable>('orders')
class OrderModel extends Model<OrderTable> {
  @column('id')
  id!: string;

  @column('name')
  name!: string;

  @column('amount')
  amount!: number;

  constructor(order?: Order) {
    super();
    if (order) {
      this.id = order.getId();
      this.name = order.getName();
      this.amount = order.getAmount();
    }
  }
}
```

Regras principais:

- `Model` guarda metadados de coluna (via `@column`) e nome da tabela (via `@model`)
- a conversao entity -> model acontece no construtor do Model (ou em um factory)
- `generateGetters()` cria getters para campos (ex.: `getName`, `isActive`, `hasProfile`), mesmo quando o valor não foi definido.

### Storage Gateway

Use `@Storage` para injetar gateways com interface `StorageGateway`.

```ts
import { Storage, StorageGateway } from './src';

class S3Gateway implements StorageGateway {
  async save(file: File, path: string) { /* ... */ }
  async get(key: string) { return 'url'; }
  async delete(key: string) { return true; }
}

class FileService {
  @Storage('S3Gateway')
  private readonly storage!: StorageGateway;
}
```

### Event Dispatcher

Use `@EventDispatcher` para enfileirar tarefas ou eventos de background com interface `EventDispatcher`.

```ts
import { EventDispatcher } from './src';

type QueueEvent = { name: string; payload?: Record<string, any> };

class QueueService {
  @EventDispatcher('QueueDispatcher')
  private readonly dispatcher!: { dispatch: (event: QueueEvent) => Promise<void> };

  async enqueue(payload: Record<string, any>) {
    await this.dispatcher.dispatch({ name: 'jobs.create', payload });
  }
}
```

### DI (Container/Inject)

Registre dependencias ao iniciar o server (usando o container padrão):

```ts
import { Dede } from './src';

class UserRepository { /* ... */ }

const app = await Dede.create({
  framework: { use: 'express', port: 3000 },
  registries: [
    { name: 'UserRepository', classLoader: UserRepository }
  ]
});
app.listen();
```

Use `@Inject('Name')` para injetar dependencias:

```ts
import { Inject, UseCase } from './src';

class ExampleUseCase extends UseCase<void, any> {
  @Inject('UserRepository')
  private readonly userRepository!: any;

  async execute() {
    return await this.userRepository.findById('1');
  }
}
```

### Errors

Erros de dominio disponiveis:

- `BadRequest` (400)
- `Unauthorized` (401)
- `Forbidden` (403)
- `NotFound` (404)
- `Conflict` (409)
- `UnprocessableEntity` (422)
- `InternalServerError` (500)

Quando um erro e lancado, o handler padroniza a resposta. Erros de dominio (`AppError`) sao mapeados para HTTP. Se o erro for `CustomServerError`, o payload customizado sera retornado diretamente.

### Protocolos de Repositorio

Interfaces tipadas para padrao de repositorio:

- `RepositoryCreate<T extends Entity>`
- `RepositoryUpdate<T extends Entity>`
- `RepositoryRemove`
- `RepositoryRestore<T extends Entity>`
- `RepositoryRemoveBy<T>`
- `RepositoryRestoreBy<T>`
- `RepositoryExistsBy<T>`
- `RepositoryNotExistsBy<T>`
- `RepositoryPagination<T>`

## Exemplos

### Express

```ts
import { Dede } from './src/dede';
import { ExampleController } from './example/express_app/example.controller';

class UserRepository {
  async findById(id: string) {
    return { id, name: 'John Doe' };
  }
}

const app = await Dede.create({
  framework: { use: 'express', port: 3000 },
  registries: [{ name: 'UserRepository', classLoader: UserRepository }]
});
app.registerControllers([ExampleController]);
app.listen();
```

### Elysia

```ts
import { Dede } from './src/dede';
import { ExampleController } from './example/express_app/example.controller';

const app = await Dede.create({
  framework: { use: 'elysia', port: 3001 },
  registries: []
});
app.registerControllers([ExampleController]);
app.listen();
```

### Background com EventDispatcher

```ts
import { EventDispatcher } from './src';

type QueueEvent = { name: string; payload: Record<string, any> };

class FileService {
  @EventDispatcher('QueueDispatcher')
  private readonly dispatcher!: { dispatch: (event: QueueEvent) => Promise<void> };

  async enqueueFile(input: { name: string; s3Key: string }) {
    await this.dispatcher.dispatch({
      name: 'files.create',
      payload: input
    });
  }
}
```

## Testes

```bash
npm test -- tests/src/application/entity.spec.ts --runInBand
```

Testes de integração (exemplos):

```bash
RUN_EXAMPLE_TESTS=true npm test -- example/tests/main.test.ts
```

Obs: os testes de Elysia só rodam no runtime do Bun (em Node eles são ignorados).

## Benchmark

Resultados locais ficam em `bench/results.md`. Para rodar:

```bash
npm run bench:compare
```

Parâmetros (opcional):

```bash
BENCH_REQUESTS=5000 BENCH_CONCURRENCY=50 BENCH_WARMUP=200 npm run bench:compare
```

Resumo (média de 3 rodadas locais, 5000 req / conc 50 / warmup 200):

- Express: avg 3.34 ms, p50 2.45 ms, p95 8.54 ms, 8298.61 req/s
- Elysia: avg 3.16 ms, p50 2.63 ms, p95 6.98 ms, 8765.78 req/s
