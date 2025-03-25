import { Registry } from '@/di/registry';
import type { Validation } from '@/protocols/Validation';
import { Controller, Delete, Get, Post, Put, Validator } from '@/decorators';


describe('Controller Decorators', () => {
  beforeEach(() => {
    Registry.clear('controllers');
    Registry.register('controllers', []);
  });

  describe('@controller', () => {
    it('should register controller and set basePath metadata', () => {
      @Controller('/users')
      class UserController { }

      const controllers = Registry.resolve<any[]>('controllers');
      expect(controllers).toContain(UserController);

      expect(Reflect.getMetadata('basePath', UserController)).toBe('/users');
    });

    it('should accumulate multiple controllers', () => {
      @Controller('/auth')
      class AuthController { }

      @Controller('/products')
      class ProductController { }

      const controllers = Registry.resolve<any[]>('controllers');
      expect(controllers).toHaveLength(2);
    });
  });

  describe('HTTP Method Decorators', () => {
    const testCases = [
      {
        decorator: Post,
        method: 'post',
        config: {
          path: '/custom',
          statusCode: 201,
          params: ['id'],
          query: ['filter']
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
        query: config.query || undefined
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
        query: undefined
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty basePath', () => {
      @Controller('')
      class EmptyPathController { }

      expect(Reflect.getMetadata('basePath', EmptyPathController)).toBe('');
    });

    it('should throw when adding to non-array controllers', () => {
      Registry.clear('controllers');
      Registry.register('controllers', {});

      expect(() => {
        @Controller('/invalid')
        class InvalidController { }
      }).toThrowError('Dependency must be an array');
    });
  });
});

describe('validation decorator', () => {
  it('should attach metadata with a validation instance when validationClass is valid', () => {
    class Validate implements Validation {
      validate() {
        return true;
      }
    }

    class TestClass {
      @Validator(Validate)
      someMethod() { }
    }

    const metadata = Reflect.getMetadata(
      'validation',
      TestClass.prototype,
      'someMethod'
    );

    expect(metadata).toBeInstanceOf(Validate);
  });
});