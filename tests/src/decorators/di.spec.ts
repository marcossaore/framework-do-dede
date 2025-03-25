import 'reflect-metadata';
import { Inject } from '@/decorators';

describe('Inject Decorator', () => {
  it('should record tokens for all decorated constructor parameters', () => {
    class TestClass {
      constructor(
        @Inject('token1') param1: any,
        @Inject('token2') param2: any
      ) {}
    }

    const injections = Reflect.getMetadata('injections', TestClass);
    
    expect(injections).toEqual(['token1', 'token2']);
  });

  it('should handle sparse decorated parameters', () => {
    class TestClass {
      constructor(
        undecoratedParam: any,
        @Inject('token1') decoratedParam: any,
        anotherUndecorated: any,
        @Inject('token3') lastDecorated: any
      ) {}
    }

    const injections = Reflect.getMetadata('injections', TestClass);
    
    expect(injections).toHaveLength(4);
    
    expect(injections[1]).toBe('token1');
    expect(injections[3]).toBe('token3');
    
    expect(injections[0]).toBeUndefined();
    expect(injections[2]).toBeUndefined();
  });

  it('should not create metadata when no parameters are decorated', () => {
    class TestClass {
      constructor(plainParam: any) {}
    }

    const injections = Reflect.getMetadata('injections', TestClass);
    expect(injections).toBeUndefined(); 
  });

  it('(unexpectedly) stores method parameters on prototype', () => {
    class TestClass {
      method(@Inject('methodToken') param: any) {}
    }

    const injections = Reflect.getMetadata('injections', TestClass.prototype);
    expect(injections).toEqual(['methodToken']);
  });
});