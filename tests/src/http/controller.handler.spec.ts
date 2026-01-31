import ControllerHandler from '@/http/controller.handler';
import { Controller, Get, Middleware, Post, UseMiddleware, UseMiddlewares } from '@/application';
import HttpServer, { HttpServerParams } from '@/http/http-server';

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
