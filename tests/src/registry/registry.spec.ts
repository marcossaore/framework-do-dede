import { Container, DefaultContainer, Inject } from '@/infra/di/registry';

describe('Container', () => {
  beforeEach(() => {
    
  });

  describe('Container Behavior', () => {
    it('should allow multiple container instances', () => {
      const instance1 = new Container();
      const instance2 = new Container();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('load and resolve returns dependencies', () => {
    it('should load and inject dependencies', () => {
      DefaultContainer.load('testToken', 'testValue');
      expect(DefaultContainer.inject('testToken')).toBe('testValue' as any);
    });

    it('should throw error if dependency is not loaded', () => {
      expect(() => DefaultContainer.inject('unregistered')).toThrowError(
        'Dependency not found unregistered'
      );
    });
  });

  describe('Dependency Injection', () => {
    class TestClass {

      @Inject('dep1')
      dep1!: { execute: () => string };

      @Inject('dep2')
      dep2!: { execute: () => number };
    }

    it('should throws if dependency is not injected in constructor', () => {
      const instance = new TestClass();
      expect(() => instance.dep1.execute()).toThrow("Dependency not found dep1")
      expect(() => instance.dep2.execute()).toThrow("Dependency not found dep2")
    });

    it('should load injected dependencies', () => {
      const instance = new TestClass();
      DefaultContainer.load('dep1', { execute: () => 'value 1' });
      DefaultContainer.load('dep2', { execute: () => 42 });
      expect(instance.dep1.execute()).toBe('value 1');
      expect(instance.dep2.execute()).toBe(42);
    });

    it('should remove dependency', () => {
      DefaultContainer.load('dep1', { execute: () => 'value 1' });
      DefaultContainer.remove('dep1');
      expect(() => DefaultContainer.inject('dep1')).toThrow("Dependency not found dep1")
    });
  });
});
