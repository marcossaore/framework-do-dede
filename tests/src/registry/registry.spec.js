"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const registry_1 = require("@/di/registry");
describe('ComponentRegistry', () => {
    beforeEach(() => {
        registry_1.Registry.clear('testToken');
        registry_1.Registry.clear('dep1');
        registry_1.Registry.clear('dep2');
        registry_1.Registry.clear('arrayToken');
        registry_1.Registry.clear('nonArray');
        registry_1.Registry.clear('clearToken');
        registry_1.Registry.clear('depA');
        registry_1.Registry.clear('depB');
        registry_1.Registry.clear('depC');
    });
    describe('Singleton Behavior', () => {
        it('should return same instance', () => {
            const instance1 = registry_1.Registry;
            const instance2 = registry_1.Registry;
            expect(instance1).toBe(instance2);
        });
    });
    describe('register e resolve', () => {
        it('should register and resolve dependencies', () => {
            registry_1.Registry.register('testToken', 'testValue');
            expect(registry_1.Registry.resolve('testToken')).toBe('testValue');
        });
        it('should throw error if dependency is not registered', () => {
            expect(() => registry_1.Registry.resolve('unregistered')).toThrowError('Dependency unregistered not registered');
        });
    });
    describe('addDependency', () => {
        it('should add a dependency to an array', () => {
            registry_1.Registry.register('arrayToken', []);
            registry_1.Registry.addDependency('arrayToken', 'item1');
            expect(registry_1.Registry.resolve('arrayToken')).toEqual(['item1']);
        });
        it('should throw error if dependency is not registered', () => {
            expect(() => registry_1.Registry.addDependency('unregistered', 'item')).toThrowError('Dependency unregistered not registered');
        });
        it('should throw error if dependency is not an array', () => {
            registry_1.Registry.register('nonArray', 'isso não é um array');
            expect(() => registry_1.Registry.addDependency('nonArray', 'item')).toThrowError('Dependency must be an array');
        });
    });
    describe('clear', () => {
        it('should clear the dependency', () => {
            registry_1.Registry.register('clearToken', 'value');
            registry_1.Registry.clear('clearToken');
            expect(() => registry_1.Registry.resolve('clearToken')).toThrow();
        });
        it('should not throw error if dependency is not registered', () => {
            expect(() => registry_1.Registry.clear('unregistered')).not.toThrow();
        });
    });
    describe('Dependency Injection', () => {
        let TestClass = class TestClass {
            constructor(dep1, dep2) {
                this.dep1 = dep1;
                this.dep2 = dep2;
            }
        };
        TestClass = __decorate([
            __param(0, registry_1.Registry.inject('dep1')),
            __param(1, registry_1.Registry.inject('dep2')),
            __metadata("design:paramtypes", [String, Number])
        ], TestClass);
        it('should load injected dependencies', () => {
            registry_1.Registry.register('dep1', 'valor1');
            registry_1.Registry.register('dep2', 42);
            const instance = registry_1.Registry.classLoader(TestClass);
            expect(instance.dep1).toBe('valor1');
            expect(instance.dep2).toBe(42);
        });
        it('should define injection metadata', () => {
            const metadata = Reflect.getMetadata('injections', TestClass);
            expect(metadata).toEqual(['dep1', 'dep2']);
        });
        it('should throw error if dependency is not registered', () => {
            registry_1.Registry.register('dep1', 'valor1');
            expect(() => registry_1.Registry.classLoader(TestClass)).toThrow();
        });
    });
    describe('Complex cases', () => {
        let AdvancedClass = class AdvancedClass {
            constructor(a, b, c) {
                this.a = a;
                this.b = b;
                this.c = c;
            }
        };
        AdvancedClass = __decorate([
            __param(0, registry_1.Registry.inject('depA')),
            __param(1, registry_1.Registry.inject('depB')),
            __param(2, registry_1.Registry.inject('depC')),
            __metadata("design:paramtypes", [String, Number, Boolean])
        ], AdvancedClass);
        it('should load multiple dependencies correctly', () => {
            registry_1.Registry.register('depA', 'A');
            registry_1.Registry.register('depB', 100);
            registry_1.Registry.register('depC', true);
            const instance = registry_1.Registry.classLoader(AdvancedClass);
            expect(instance.a).toBe('A');
            expect(instance.b).toBe(100);
            expect(instance.c).toBe(true);
        });
    });
    describe('Classes without dependencies', () => {
        class EmptyClass {
        }
        it('should instantiate a class without dependencies', () => {
            const instance = registry_1.Registry.classLoader(EmptyClass);
            expect(instance).toBeInstanceOf(EmptyClass);
        });
    });
});
