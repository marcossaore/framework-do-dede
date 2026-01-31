# Refactoring Plan (Framework do Dedé)

Objetivo: simplificar a arquitetura, reduzir acoplamento/global state, melhorar previsibilidade/performance e alinhar melhor com DDD.

---

## Diagnóstico rápido (o que hoje dói)

1) **Estado global e “auto‑registro”**
- Controllers são registrados em uma lista global e “flush” no boot. Isso dificulta testes, composição e múltiplas instâncias da app.
- `Registry` é singleton global sem escopo por request/instância.

2) **Acoplamento entre HTTP e Application**
- `ControllerHandler` monta rota, filtra input, aplica middlewares e executa use case dentro do mesmo componente.
- A camada HTTP conhece demais o modelo de request do application.

3) **DDD superficial**
- Entities hoje viram DTOs “serializáveis” e estão misturadas com “infra” (decorators de serialização).
- Pouca separação entre domínio, aplicação e infraestrutura.

4) **Bugs e inconsistências**
- `src/http/http-server.ts` usa `request.ipç` (typo) no Express.
- `Entity.toAsyncEntity()` referencia `valueIsZero` que não existe.
- `filter()` ignora valores falsy (0/false/"") por usar `if (!value) continue`.
- `Registry.inject` retorna classe/construtor sem instanciar, enquanto o ControllerHandler instancia controller; isso mistura padrões de criação.

5) **Performance/opacidade**
- Uso pesado de Reflection/Decorators e metadados em runtime.
- Muita lógica dinâmica (Proxy, metadata, análise de tipos) por request.

---

## Como “deveria ser” (visão simplificada)

- **App Instance explícita**: uma instância de aplicação que recebe controllers/rotas e injeta dependências de forma declarativa.
- **Separação clara de camadas**:
  - `domain/`: Entities, Value Objects, Domain Services (sem dependências externas/infra).
  - `application/`: Use cases, DTOs, Ports (interfaces).
  - `infra/`: adapters HTTP, persistência, DI container.
- **Menos magia, mais explícito**: decorators só onde realmente agregam valor; evitar metadata global para registrar tudo.
- **UseCases como unidade central**: controllers chamam use cases; controllers só fazem adaptação de input/output.
- **DI simples e previsível**: container por instância do app, com escopo de request opcional (sem singleton global obrigatório).

---

## Passo a passo de refactor (fazer nesta ordem)

### 1) Criar estrutura de pastas por camada
- Criar `src/domain`, `src/application`, `src/infra`, `src/interface/http`.
- Mover `Entity` base para `src/domain/entity` e manter serialização em `src/infra/serialization/entity` (ver passo 6).

### 2) Isolar o container de DI por instância
- Transformar `Registry` em classe instanciável (`new Container()`), não singleton.
- Remover `Registry.getInstance()` e criar `container` dentro do `Dede`.
- Atualizar `Inject` para aceitar container ou usar factory explícita.

### 3) Remover estado global de controllers
- Substituir `controllers: string[]` por registro local no `Dede`/App.
- Em `ControllerHandler`, receber explicitamente a lista de controllers para registrar.
- Não usar `flushControllers()`.

### 4) Tornar o boot explícito
- `Dede.start()` vira algo como:
  - `const app = Dede.create({ framework, container });`
  - `app.registerControllers([UserController, ...])`
  - `app.listen(port)`
- Remover `setTimeout` artificial no load de registries.

### 5) Separar HTTP pipeline do Core
- Criar um `RequestMapper` (HTTP → Input DTO) e um `ResponseMapper`.
- `ControllerHandler` não deve conhecer `Entity` ou serialização.
- Middlewares HTTP devem ser claramente separados dos “application middlewares”.

### 6) Revisar o modelo de Entity/Serialização
- Mover serialização para um `Serializer` na camada `infra` ou `interface`.
- `Entity` deve focar em invariantes/behavior, não em DTO.
- `toEntity()/toData()` devem ser opcionais ou substituídos por `Mapper`.

### 7) Validar inputs fora do Controller
- Criar um `Validator` pluggable (ex.: schema/DTO), sem “stringly typed” ("name|string").
- `ControllerHandler` apenas chama o validator e injeta `request.data` tipado.

### 8) Unificar tratamento de erros
- Criar uma interface `AppError` no domínio/application.
- Adapters HTTP traduzem `AppError` para status code.
- Evitar `CustomServerError` com payload arbitrário dentro do core.

### 9) Corrigir bugs atuais
- Corrigir `request.ipç` para `request.ip` (Express).
- Corrigir `valueIsZero` inexistente em `toAsyncEntity`.
- Ajustar `filter()` para aceitar valores falsy corretamente.

### 10) Medir performance antes/depois
- Criar benchmark simples (ex.: 1 rota GET) com script local.
- Rodar: `npm run bench -- --url=http://localhost:3000/example --requests=500 --concurrency=20 --warmup=50`
- Comparar latência p50/p95 e throughput antes/depois do refactor.

---

## O que manter e o que remover

**Manter**
- Middleware pipeline.
- Tracing (mas desacoplado do Controller).

**Remover / substituir**
- Registro global de controllers.
- DI singleton global.
- Filtro de input baseado em string (substituir por schema).

---

## Resultado esperado

- Menos acoplamento entre camadas.
- Melhor testabilidade e previsibilidade.
- Curva de aprendizado menor.
- Menos magia/reflection em runtime.
- Base sólida para evoluir DDD de verdade (aggregates, repos, services).

---

Se quiser, posso implementar passo a passo a partir do item 1.
