import ControllerHandler from '@/http/controller.handler';
import { Controller, Get, Middleware, Post, UseMiddleware, UseMiddlewares } from '@/application';
import HttpServer, { HttpServerParams } from '@/http/http-server';
import { flushControllers } from '@/application/controller';

describe('ControllerHandler middleware resolution', () => {
  beforeEach(() => {
    flushControllers();
  });

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
    const routes = (handler as any).registryControllers();

    const resolved = routes[0].middlewares?.[0];
    expect(resolved).toBeInstanceOf(AuthMiddleware);
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
    const routes = (handler as any).registryControllers();

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
    const routes = (handler as any).registryControllers();

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
    const routes = (handler as any).registryControllers();

    const middlewares = routes[0].middlewares || [];
    expect(middlewares[0]).toBeInstanceOf(LoggerMiddleware);
    expect(middlewares[1]).toBe(instance);
    expect(middlewares[2]).toBeInstanceOf(AuthMiddleware);
  });
});

describe('ControllerHandler multipart form-data normalization', () => {
  beforeEach(() => {
    flushControllers();
  });

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

  it('normalizes bracket notation from multipart/form-data into an object', async () => {
    @Controller('/users')
    class UserController {
      @Post({ path: '/upload' })
      upload(request: { data: any }) {
        return request.data;
      }
    }

    const server = new FakeHttpServer();
    new ControllerHandler(server, 3000);

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
