import { Controller, Delete, Get, Post, Put } from '@/application/decorators';


describe('Controller Decorators', () => {
  describe('@Controller', () => {
    it('should register controller and set basePath metadata', () => {
      @Controller('/users')
      class UserController { }
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
    it('should throw when empty basePath is empty', () => {
      try {
        @Controller('')
        class EmptyPathController { }
      }
      catch (error: any) {
        expect(error.message).toBe("basePath cannot be empty")
      }
    });
  });
});