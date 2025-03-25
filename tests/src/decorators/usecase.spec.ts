import 'reflect-metadata';
import { Auth } from '@/decorators';

describe('Auth Decorator', () => {
  it('should set default "auth" metadata on class when used without parameters', () => {
    // Class with default @Auth() decorator
    class TestClass {
      @Auth()
      method() {}
    }

    const metadata = Reflect.getMetadata('auth', TestClass);
    expect(metadata).toBe('auth');
  });

  it('should set custom metadata value when provided with parameter', () => {
    // Class with parameterized @Auth decorator
    class TestClass {
      @Auth('custom-auth-property')
      method() {}
    }

    const metadata = Reflect.getMetadata('auth', TestClass);
    expect(metadata).toBe('custom-auth-property');
  });

  it('should overwrite metadata with last-applied decorator value', () => {
    // Class with multiple decorated methods
    class TestClass {
      @Auth('first') method1() {}
      @Auth('second') method2() {}
      @Auth('third') method3() {}
    }

    const metadata = Reflect.getMetadata('auth', TestClass);
    expect(metadata).toBe('third'); // Last decorator wins
  });

  it('should not set metadata when no decorators are used', () => {
    // Class without any decorators
    class TestClass {
      plainMethod() {}
    }

    const metadata = Reflect.getMetadata('auth', TestClass);
    expect(metadata).toBeUndefined();
  });

  it('should store metadata directly on class constructor', () => {
    // Verify metadata storage location
    class TestClass {
      @Auth('direct-check')
      method() {}
    }

    const hasOwnMetadata = Reflect.hasOwnMetadata('auth', TestClass);
    expect(hasOwnMetadata).toBe(true);
  });
});