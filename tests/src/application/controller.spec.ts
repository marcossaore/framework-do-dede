import { Controller, Delete, Get, UseMiddleware, UseMiddlewares, Post, Put, Middleware } from '@/application';

describe('Controller', () => {
  describe('@Controller', () => {

    @Controller('/users')
    class UserController { }

    it('should register controller and set basePath metadata', () => {
      expect(Reflect.getMetadata('basePath', UserController)).toBe('/users');
    });

    it('should accumulate multiple controllers', () => {
      @Controller('/auth')
      class AuthController { }

      @Controller('/products')
      class ProductController { }

      expect(Reflect.getMetadata('basePath', AuthController)).toBe('/auth');
      expect(Reflect.getMetadata('basePath', ProductController)).toBe('/products');
    });

    describe('HTTP Method Decorators', () => {
      const testCases: { decorator: any, method: string, config: any }[] = [
        {
          decorator: Post,
          method: 'post',
          config: {
            path: '/custom',
            statusCode: 201,
            params: ['id'],
            query: ['filter'],
          }
        },
        {
          decorator: Get,
          method: 'get',
          config: { path: '/list' }
        },
        {
          decorator: Put,
          method: 'put',
          config: { statusCode: 204 }
        },
        {
          decorator: Delete,
          method: 'delete',
          config: {}
        }
      ];

      test.each(testCases)('$method should set metadata correctly', ({ decorator, method, config }) => {
        @Controller('/api')
        class TestController {
          @decorator(config)
          testMethod() { }
        }

        const metadata = Reflect.getMetadata(
          'route',
          TestController.prototype,
          'testMethod'
        );

        expect(metadata).toMatchObject({
          method,
          path: config.path || '',
          statusCode: config.statusCode || 200,
          params: config.params || undefined,
          query: config.query || undefined,
          headers: config.headers || undefined,
          responseType: config.responseType || 'json'
        });
      });

      it('should handle multiple methods in same controller', () => {
        @Controller('/multi')
        class MultiController {
          @Post({ path: '/create' })
          create() { }

          @Get({ path: '/list' })
          list() { }
        }

        const postMetadata = Reflect.getMetadata(
          'route',
          MultiController.prototype,
          'create'
        );

        const getMetadata = Reflect.getMetadata(
          'route',
          MultiController.prototype,
          'list'
        );

        expect(postMetadata.method).toBe('post');
        expect(getMetadata.method).toBe('get');
      });

      it('should use default values when config omitted', () => {
        class DefaultController {
          @Get()
          fetch() { }
        }

        const metadata = Reflect.getMetadata(
          'route',
          DefaultController.prototype,
          'fetch'
        );

        expect(metadata).toEqual({
          method: 'get',
          path: '',
          statusCode: 200,
          params: undefined,
          query: undefined,
          headers: undefined,
          responseType: 'json'
        });
      });
    });

    describe('Edge Cases', () => {
      it('should throw when empty basePath is empty', () => {
        expect(() => {
          @Controller('')
          class EmptyPathController { }
        }).toThrow('basePath cannot be empty');
      });
    });

    describe('@Middleware', () => {

      class User {
        constructor(public name: string) {
        }
        getName() {
          return this.name;
        }
      }

      class AuthMiddleware implements Middleware {
        execute(input: any): Promise<{ auth: User }> {
          const user = new User('John Doe');
          return Promise.resolve({ auth: user });
        }
      }

      class AuthMiddleware2 implements Middleware {
        execute(input: any): Promise<{ auth: User }> {
          const user = new User('John Doe');
          return Promise.resolve({ auth: user });
        }
      }

      @Controller('/users')
      class UserController {
        @UseMiddleware(AuthMiddleware)
        testMethod(input: any) {
          console.log('testMethod called with input', input);
        }
      }

      it('should register middleware and set metadata', () => {
        const metadata = Reflect.getMetadata('middlewares', UserController.prototype, 'testMethod');
        expect(metadata).toBeDefined();
        expect(metadata.length).toBe(1);
        expect(metadata[0]).toBe(AuthMiddleware);
      });

      it('should register multiple middlewares', () => {
        @Controller('/users')
        class UserController {
          @UseMiddlewares([AuthMiddleware, AuthMiddleware2])
          testMethod(input: any) {
            console.log('testMethod called with input', input);
          }
        }

        const metadata = Reflect.getMetadata('middlewares', UserController.prototype, 'testMethod');
        expect(metadata).toBeDefined();
        expect(metadata.length).toBe(2);
        expect(metadata[0]).toBe(AuthMiddleware);
        expect(metadata[1]).toBe(AuthMiddleware2)
      });

      it('should throw when middleware does not implement execute method', () => {
        
        class NotMiddleware {
          execute2(input: any): Promise<{ auth: User }> {
            return Promise.resolve({ auth: new User('John Doe') });
          }
        }

        expect(() => {
          @Controller('/users')
          class UserController {
            @UseMiddleware(NotMiddleware as any)
            testMethod() {}
          }
        }).toThrow('Middleware must implement execute()');
      });
    });
  });
});