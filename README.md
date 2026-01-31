# Framework do Dedé

Um framework TypeScript simples para construir APIs HTTP com controllers, use cases e entities, com suporte a Express ou Elysia, DI leve e serialização de entidades.

## Índice

- Instalação
- Quickstart
- Conceitos
  - Controllers e Rotas
  - Input, params e filtros
  - Middlewares
  - Tracing
  - UseCase e Decorators
  - Entity e Serialização
  - Hooks Before/After ToEntity
  - Storage Gateway
  - DI (Registry/Inject)
  - Errors
  - Protocolos de Repositório
- Exemplos
  - Express
  - Elysia
  - Fila com AfterToEntity
- Testes

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

await Dede.start({
  framework: { use: 'express', port: 3000 },
  registries: []
});
```

## Conceitos

### Controllers e Rotas

Use decorators para expor métodos como rotas HTTP. O Controller registra o class loader no Registry e o ControllerHandler monta as rotas em runtime.

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

### Input, params e filtros

O framework compõe um objeto `request.data` a partir de:

1) headers filtrados
2) params filtrados
3) query filtrada
4) body filtrado

Quando `bodyFilter: "restrict"`, apenas os campos definidos em `body` serão usados. Caso contrário, o corpo completo é mesclado.

Tipos suportados no filtro:

- `boolean`, `integer`, `string`, `number`

Exemplo:

```ts
@Put({
  params: ['id|string'],
  query: ['active|boolean'],
  headers: ['x-type|string'],
  body: ['name|string'],
  bodyFilter: 'restrict'
})
async update(request: { data: any }) {
  // request.data: { id, active, 'x-type', name }
}
```

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

Decorator `@DecorateUseCase` permite executar use cases antes do principal (chaining).

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

### Entity e Serializacao

Entities suportam:

- `toEntity()` e `toAsyncEntity()`
- `toData()` e `toAsyncData()`
- `@Serialize`, `@Restrict`, `@VirtualProperty`, `@GetterPrefix`

```ts
import { Entity, Serialize, Restrict, VirtualProperty, GetterPrefix } from './src';

class User extends Entity {
  @Serialize((value: Email) => value.getValue())
  private readonly email: Email;

  @Restrict()
  private readonly passwordHash: string;

  @GetterPrefix('has')
  private readonly profile?: Profile;

  @VirtualProperty('displayName')
  private display() {
    return 'User ' + this.email.getValue();
  }

  constructor(email: string, passwordHash: string) {
    super();
    this.email = new Email(email);
    this.passwordHash = passwordHash;
    this.generateGetters();
  }
}

const user = new User('a@b.com', 'hash');
const serialized = user.toEntity();
```

Regras principais:

- `@Serialize` pode retornar objeto: cada chave vira uma propriedade do resultado
- `@Restrict` remove campo em `toData`
- `@VirtualProperty` mapeia metodos para campos virtuais
- `generateGetters()` cria getters para campos (ex.: `getName`, `isActive`, `hasProfile`)

### Hooks Before/After ToEntity

Use `@BeforeToEntity()` e `@AfterToEntity()` em metodos de Entities.

- Before recebe objeto bruto (antes de serializacao)
- After recebe objeto tratado (resultado final)
- `toEntity()` executa hooks sem aguardar promessas
- `toAsyncEntity()` aguarda hooks async

```ts
import { Entity, AfterToEntity, BeforeToEntity } from './src';

class FileEntity extends Entity {
  private readonly name: string;
  private readonly s3Key: string;

  constructor(name: string, s3Key: string) {
    super();
    this.name = name;
    this.s3Key = s3Key;
  }

  @BeforeToEntity()
  private before(payload: Record<string, any>) {
    payload.rawTouched = true;
  }

  @AfterToEntity()
  private async after(payload: Record<string, any>) {
    await saveToS3(payload.s3Key);
  }
}
```

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

### DI (Registry/Inject)

Registre dependencias ao iniciar o server:

```ts
import { Dede } from './src';

class UserRepository { /* ... */ }

await Dede.start({
  framework: { use: 'express', port: 3000 },
  registries: [
    { name: 'UserRepository', classLoader: UserRepository }
  ]
});
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

Quando um erro e lancado, o handler padroniza a resposta. Se o erro for `CustomServerError`, o payload customizado sera retornado diretamente.

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
import './example/express_app/example.controller';

class UserRepository {
  async findById(id: string) {
    return { id, name: 'John Doe' };
  }
}

await Dede.start({
  framework: { use: 'express', port: 3000 },
  registries: [{ name: 'UserRepository', classLoader: UserRepository }]
});
```

### Elysia

```ts
import { Dede } from './src/dede';
import './example/express_app/example.controller';

await Dede.start({
  framework: { use: 'elysia', port: 3001 },
  registries: []
});
```

### Fila com AfterToEntity

```ts
import { Entity, AfterToEntity } from './src/application/entity';

type QueueJob = { type: string; payload: Record<string, any> };

type Queue = { enqueue(job: QueueJob): Promise<void> };

const queue: Queue = {
  async enqueue(job) {
    console.log('queued job', job);
  }
};

class FileEntity extends Entity {
  private readonly name: string;
  private readonly s3Key: string;

  private constructor({ name, s3Key }: { name: string; s3Key: string }) {
    super();
    this.name = name;
    this.s3Key = s3Key;
  }

  @AfterToEntity()
  private async enqueueFileSync(payload: Record<string, any>) {
    await queue.enqueue({
      type: 'files.create',
      payload: {
        name: payload.name,
        s3Key: payload.s3Key
      }
    });
  }

  static create(input: { name: string; s3Key: string }) {
    return new FileEntity(input);
  }
}

const entity = FileEntity.create({ name: 'report', s3Key: 's3://bucket/report.pdf' });
const serialized = entity.toEntity();
```

## Testes

```bash
npm test -- tests/src/application/entity.spec.ts --runInBand
```
