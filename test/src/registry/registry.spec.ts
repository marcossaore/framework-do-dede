import { beforeEach, describe, expect, it } from 'bun:test'
import 'reflect-metadata';
import { Registry } from '@/di/registry';

describe('ComponentRegistry', () => {
  beforeEach(() => {
    Registry.clear('testToken');
    Registry.clear('dep1');
    Registry.clear('dep2');
    Registry.clear('arrayToken');
    Registry.clear('nonArray');
    Registry.clear('clearToken');
    Registry.clear('depA');
    Registry.clear('depB');
    Registry.clear('depC');
  });

  describe('Singleton Behavior', () => {
    it('should return same instance', () => {
      const instance1 = Registry
      const instance2 = Registry
      expect(instance1).toBe(instance2);
    });
  });

  describe('register e resolve', () => {
    it('should register and resolve dependencies', () => {
      Registry.register('testToken', 'testValue');
      expect(Registry.resolve('testToken')).toBe('testValue' as any);
    });

    it('should throw error if dependency is not registered', () => {
      expect(() => Registry.resolve('unregistered')).toThrowError(
        'Dependency unregistered not registered'
      );
    });
  });

  describe('addDependency', () => {
    it('should add a dependency to an array', () => {
      Registry.register('arrayToken', []);
      Registry.addDependency('arrayToken', 'item1');
      expect(Registry.resolve('arrayToken')).toEqual(['item1'] as any);
    });

    it('should throw error if dependency is not registered', () => {
      expect(() => Registry.addDependency('unregistered', 'item')).toThrowError(
        'Dependency unregistered not registered'
      );
    });

    it('should throw error if dependency is not an array', () => {
      Registry.register('nonArray', 'isso não é um array');
      expect(() => Registry.addDependency('nonArray', 'item')).toThrowError(
        'Dependency must be an array'
      );
    });
  });

  describe('clear', () => {
    it('should clear the dependency', () => {
      Registry.register('clearToken', 'value');
      Registry.clear('clearToken');
      expect(() => Registry.resolve('clearToken')).toThrow();
    });

    it('should not throw error if dependency is not registered', () => {
      expect(() => Registry.clear('unregistered')).not.toThrow();
    });
  });

  describe('Dependency Injection', () => {
    class TestClass {
      constructor(
        @Registry.inject('dep1') public dep1: string,
        @Registry.inject('dep2') public dep2: number
      ) {}
    }

    it('should load injected dependencies', () => {
      Registry.register('dep1', 'valor1');
      Registry.register('dep2', 42);

      const instance = Registry.classLoader(TestClass);
      expect(instance.dep1).toBe('valor1');
      expect(instance.dep2).toBe(42);
    });

    it('should define injection metadata', () => {
      const metadata = Reflect.getMetadata('injections', TestClass);
      expect(metadata).toEqual(['dep1', 'dep2']);
    });

    it('should throw error if dependency is not registered', () => {
      Registry.register('dep1', 'valor1');
      expect(() => Registry.classLoader(TestClass)).toThrow();
    });
  });

  describe('Complex cases', () => {
    class AdvancedClass {
      constructor(
        @Registry.inject('depA') public a: string,
        @Registry.inject('depB') public b: number,
        @Registry.inject('depC') public c: boolean
      ) {}
    }

    it('should load multiple dependencies correctly', () => {
      Registry.register('depA', 'A');
      Registry.register('depB', 100);
      Registry.register('depC', true);

      const instance = Registry.classLoader(AdvancedClass);
      expect(instance.a).toBe('A');
      expect(instance.b).toBe(100);
      expect(instance.c).toBe(true);
    });
  });

  describe('Classes without dependencies', () => {
    class EmptyClass {}

    it('should instantiate a class without dependencies', () => {
      const instance = Registry.classLoader(EmptyClass);
      expect(instance).toBeInstanceOf(EmptyClass);
    });
  });
});