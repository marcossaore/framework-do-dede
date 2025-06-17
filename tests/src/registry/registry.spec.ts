import { Inject, Registry } from '@/infra/di/registry';

describe('Registry', () => {
  beforeEach(() => {
    
  });

  describe('Singleton Behavior', () => {
    it('should return same instance', () => {
      const instance1 = Registry
      const instance2 = Registry
      expect(instance1).toBe(instance2);
    });
  });

  describe('load and resolve returns dependencies', () => {
    it('should load and inject dependencies', () => {
      Registry.load('testToken', 'testValue');
      expect(Registry.inject('testToken')).toBe('testValue' as any);
    });

    it('should throw error if dependency is not loaded', () => {
      expect(() => Registry.inject('unregistered')).toThrowError(
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
      Registry.load('dep1', { execute: () => 'value 1' });
      Registry.load('dep2', { execute: () => 42 });
      expect(instance.dep1.execute()).toBe('value 1');
      expect(instance.dep2.execute()).toBe(42);
    });

    it('should remove dependency', () => {
      Registry.load('dep1', { execute: () => 'value 1' });
      Registry.remove('dep1');
      expect(() => Registry.inject('dep1')).toThrow("Dependency not found dep1")
    });
  });
});