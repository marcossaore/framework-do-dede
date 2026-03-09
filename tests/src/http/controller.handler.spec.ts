import ControllerHandler from '@/http/controller.handler';
import { Controller, Get, Middleware, Post, UseMiddleware, UseMiddlewares, Version, PresetIgnore, NoTracing } from '@/application';
import { Tracer, TracerData, Tracing } from '@/application/controller';
import HttpServer, { HttpServerParams } from '@/http/http-server';
import { Container, setDefaultContainer } from '@/infra/di/registry';

class FakeHttpServer extends HttpServer {
  public registrations: { params: HttpServerParams; handler: CallableFunction }[] = [];

  constructor() {
    super(
      {
        listen: () => undefined,
        use: () => undefined,
        get: () => undefined,
        post: () => undefined,
        put: () => undefined,
        delete: () => undefined,
        patch: () => undefined
      },
      'express'
    );
  }

  register(httpServerParams: HttpServerParams, handler: CallableFunction): void {
    this.registrations.push({ params: httpServerParams, handler });
  }

  async close(): Promise<void> {
    return;
  }
}

beforeEach(() => {
  setDefaultContainer(new Container());
});

describe('ControllerHandler middleware resolution', () => {
  class AuthMiddleware implements Middleware {
    async execute(): Promise<{ auth: boolean }> {
      return { auth: true };
    }
  }

  class LoggerMiddleware implements Middleware {
    async execute(): Promise<{ logged: boolean }> {
      return { logged: true };
    }
  }

  it('resolves middleware class to an instance', () => {
    @Controller('/users')
    class UserController {
      @UseMiddleware(AuthMiddleware)
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const resolved = routes[0].middlewares?.[0];
    expect(resolved).toBeInstanceOf(AuthMiddleware);
  });

  it('resolves controller-level middleware on all routes', () => {
    @Controller('/users')
    @UseMiddleware(AuthMiddleware)
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const resolved = routes[0].middlewares?.[0];
    expect(resolved).toBeInstanceOf(AuthMiddleware);
  });

  it('merges controller and method middlewares preserving order', () => {
    @Controller('/users')
    @UseMiddleware(LoggerMiddleware)
    class UserController {
      @UseMiddleware(AuthMiddleware)
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const middlewares = routes[0].middlewares || [];
    expect(middlewares[0]).toBeInstanceOf(LoggerMiddleware);
    expect(middlewares[1]).toBeInstanceOf(AuthMiddleware);
  });

  it('keeps middleware instance when provided', () => {
    const instance = new AuthMiddleware();

    @Controller('/users')
    class UserController {
      @UseMiddleware(instance)
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const resolved = routes[0].middlewares?.[0];
    expect(resolved).toBe(instance);
  });

  it('resolves middleware factory to an instance', () => {
    const factory = () => new AuthMiddleware();

    @Controller('/users')
    class UserController {
      @UseMiddleware(factory)
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const resolved = routes[0].middlewares?.[0];
    expect(resolved).toBeInstanceOf(AuthMiddleware);
  });

  it('resolves multiple middleware definitions', () => {
    const instance = new LoggerMiddleware();
    const factory = () => new AuthMiddleware();

    @Controller('/users')
    class UserController {
      @UseMiddlewares([LoggerMiddleware, instance, factory])
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const middlewares = routes[0].middlewares || [];
    expect(middlewares[0]).toBeInstanceOf(LoggerMiddleware);
    expect(middlewares[1]).toBe(instance);
    expect(middlewares[2]).toBeInstanceOf(AuthMiddleware);
  });

  it('maps responseType and useHeaders from route metadata', () => {
    @Controller('/files')
    class FileController {
      @Get({
        path: '/download',
        responseType: 'application/octet-stream',
        useHeaders: {
          'Content-Disposition': 'attachment; filename="file.bin"',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
      download() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([FileController]);

    expect(routes[0].responseType).toBe('application/octet-stream');
    expect(routes[0].useHeaders).toEqual({
      'Content-Disposition': 'attachment; filename="file.bin"',
      'Cache-Control': 'public, max-age=31536000'
    });
  });

  it('resolves tracer from container when @Tracing() is used without args', () => {
    class TracerMock implements Tracer<void> {
      trace(_: TracerData): void {}
    }

    const container = new Container();
    container.load('Tracer', new TracerMock());
    setDefaultContainer(container);

    @Controller('/users')
    class UserController {
      @Tracing()
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    expect(routes[0].handler.tracer).toBeInstanceOf(TracerMock);
  });

  it('keeps explicit tracer instance when @Tracing(new Tracer()) is used', () => {
    class TracerMock implements Tracer<void> {
      trace(_: TracerData): void {}
    }

    @Controller('/users')
    class UserController {
      @Tracing(new TracerMock())
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    expect(routes[0].handler.tracer).toBeInstanceOf(TracerMock);
  });

  it('throws when @Tracing() is used and Tracer is not in container', () => {
    setDefaultContainer(new Container());

    @Controller('/users')
    class UserController {
      @Tracing()
      @Get({ path: '/list' })
      list() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    expect(() => (handler as any).registryControllers([UserController])).toThrow('Tracer not found in container: Tracer');
  });

  it('resolves tracer for all routes when tracer option is enabled', () => {
    class TracerMock implements Tracer<void> {
      trace(_: TracerData): void {}
    }

    const container = new Container();
    container.load('Tracer', new TracerMock());
    setDefaultContainer(container);

    @Controller('/users')
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { tracer: true });

    expect(server.registrations[0].params.handler.tracer).toBeInstanceOf(TracerMock);
  });

  it('throws when tracer option is enabled and Tracer is not in container', () => {
    setDefaultContainer(new Container());

    @Controller('/users')
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    expect(() => new ControllerHandler(server, [UserController], { tracer: true }))
      .toThrow('Tracer not found in container: Tracer');
  });

  it('does not leak method tracer to other methods without tracing metadata', () => {
    class TracerMock implements Tracer<void> {
      trace(_: TracerData): void {}
    }

    @Controller('/users')
    class UserController {
      @Tracing(new TracerMock())
      @Get({ path: '/a' })
      a() {}

      @Get({ path: '/b' })
      b() {}
    }

    const handler = Object.create(ControllerHandler.prototype) as ControllerHandler;
    const routes = (handler as any).registryControllers([UserController]);

    const routeA = routes.find((route: HttpServerParams) => route.route.endsWith('/a'));
    const routeB = routes.find((route: HttpServerParams) => route.route.endsWith('/b'));

    expect(routeA?.handler.tracer).toBeInstanceOf(TracerMock);
    expect(routeB?.handler.tracer).toBeUndefined();
  });

  it('disables global tracer for all controller routes when @NoTracing() is used on controller', () => {
    class TracerMock implements Tracer<void> {
      trace(_: TracerData): void {}
    }

    const container = new Container();
    container.load('Tracer', new TracerMock());
    setDefaultContainer(container);

    @NoTracing()
    @Controller('/users')
    class UserController {
      @Get({ path: '/a' })
      a() {}

      @Get({ path: '/b' })
      b() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { tracer: true });

    expect(server.registrations[0].params.handler.tracer).toBeUndefined();
    expect(server.registrations[1].params.handler.tracer).toBeUndefined();
  });

  it('disables global tracer only for annotated method when @NoTracing() is used on method', () => {
    class TracerMock implements Tracer<void> {
      trace(_: TracerData): void {}
    }

    const container = new Container();
    container.load('Tracer', new TracerMock());
    setDefaultContainer(container);

    @Controller('/users')
    class UserController {
      @NoTracing()
      @Get({ path: '/a' })
      a() {}

      @Get({ path: '/b' })
      b() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { tracer: true });

    const routeA = server.registrations.find(route => route.params.route.endsWith('/a'));
    const routeB = server.registrations.find(route => route.params.route.endsWith('/b'));

    expect(routeA?.params.handler.tracer).toBeUndefined();
    expect(routeB?.params.handler.tracer).toBeInstanceOf(TracerMock);
  });
});

describe('ControllerHandler multipart form-data normalization', () => {
  it('normalizes bracket notation from multipart/form-data into an object', async () => {
    @Controller('/users')
    class UserController {
      @Post({ path: '/upload' })
      upload(request: { data: any }) {
        return request.data;
      }
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController]);

    const handler = server.registrations[0].handler;
    const response = await handler({
      headers: { 'content-type': 'multipart/form-data; boundary=----test' },
      body: {
        'user[name]': 'Ana',
        'user[age]': '30',
        flat: 'value'
      },
      params: {},
      query: {},
      setStatus: jest.fn()
    });

    expect(response).toEqual({
      user: {
        name: 'Ana',
        age: '30'
      },
      flat: 'value'
    });
  });
});

describe('ControllerHandler body filtering', () => {
  it('merges the original body with filtered/typed fields when bodyFilter is none', async () => {
    @Controller('/users')
    class UserController {
      @Post({ path: '/create', body: ['age|integer'] })
      create(request: { data: any }) {
        return request.data;
      }
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController]);

    const handler = server.registrations[0].handler;
    const response = await handler({
      headers: {},
      body: {
        age: '20',
        name: 'Ana'
      },
      params: {},
      query: {},
      setStatus: jest.fn()
    });

    expect(response).toEqual({
      age: 20,
      name: 'Ana'
    });
  });

  it('keeps only filtered/typed fields when bodyFilter is restrict', async () => {
    @Controller('/users')
    class UserController {
      @Post({ path: '/create', body: ['age|integer'], bodyFilter: 'restrict' })
      create(request: { data: any }) {
        return request.data;
      }
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController]);

    const handler = server.registrations[0].handler;
    const response = await handler({
      headers: {},
      body: {
        age: '20',
        name: 'Ana'
      },
      params: {},
      query: {},
      setStatus: jest.fn()
    });

    expect(response).toEqual({
      age: 20
    });
  });

  it('casts number fields when body filter uses number type', async () => {
    @Controller('/products')
    class ProductController {
      @Post({ path: '/create', body: ['price|number'], bodyFilter: 'restrict' })
      create(request: { data: any }) {
        return request.data;
      }
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [ProductController]);

    const handler = server.registrations[0].handler;
    const response = await handler({
      headers: {},
      body: {
        price: '10.50',
        name: 'Book'
      },
      params: {},
      query: {},
      setStatus: jest.fn()
    });

    expect(response).toEqual({
      price: 10.5
    });
  });
});

describe('ControllerHandler versioning and prefix', () => {
  it('applies global prefix and version to routes', () => {
    @Controller('/users')
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { prefix: '/api', version: 2 });

    expect(server.registrations[0].params.route).toBe('/api/v2/users/list');
  });

  it('ignores global prefix and version when annotated', () => {
    @PresetIgnore(true, true)
    @Controller('/health')
    class HealthController {
      @Get({ path: '/ping' })
      ping() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [HealthController], { prefix: '/api', version: 2 });

    expect(server.registrations[0].params.route).toBe('/health/ping');
  });

  it('method preset overrides controller preset', () => {
    @PresetIgnore(true, true)
    @Controller('/users')
    class UserController {
      @PresetIgnore(true, false)
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { prefix: '/api', version: 2 });

    expect(server.registrations[0].params.route).toBe('/v2/users/list');
  });

   it('should works if none version is provided', () => {
    @Controller('/users')
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController]);

    expect(server.registrations[0].params.route).toBe('/users/list');
  });

  it('should works if only prefix is provided', () => {
    @Controller('/users')
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { prefix: '/api' });

    expect(server.registrations[0].params.route).toBe('/api/users/list');
  });

  it('should works if only version is provided', () => {
    @Version(4)
    @Controller('/users')
    class UserController {
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController]);

    expect(server.registrations[0].params.route).toBe('/v4/users/list');
  });

  it('method version overrides global version', () => {
    @Controller('/users')
    class UserController {
      @Version(3)
      @Get({ path: '/list' })
      list() {}
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, [UserController], { prefix: '/api', version: 1 });

    expect(server.registrations[0].params.route).toBe('/api/v3/users/list');
  });
});
