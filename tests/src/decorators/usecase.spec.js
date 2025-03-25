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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const decorators_1 = require("@/decorators");
describe('Auth Decorator', () => {
    it('should set default "auth" metadata on class when used without parameters', () => {
        // Class with default @Auth() decorator
        class TestClass {
            method() { }
        }
        __decorate([
            (0, decorators_1.Auth)(),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method", null);
        const metadata = Reflect.getMetadata('auth', TestClass);
        expect(metadata).toBe('auth');
    });
    it('should set custom metadata value when provided with parameter', () => {
        // Class with parameterized @Auth decorator
        class TestClass {
            method() { }
        }
        __decorate([
            (0, decorators_1.Auth)('custom-auth-property'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method", null);
        const metadata = Reflect.getMetadata('auth', TestClass);
        expect(metadata).toBe('custom-auth-property');
    });
    it('should overwrite metadata with last-applied decorator value', () => {
        // Class with multiple decorated methods
        class TestClass {
            method1() { }
            method2() { }
            method3() { }
        }
        __decorate([
            (0, decorators_1.Auth)('first'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method1", null);
        __decorate([
            (0, decorators_1.Auth)('second'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method2", null);
        __decorate([
            (0, decorators_1.Auth)('third'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method3", null);
        const metadata = Reflect.getMetadata('auth', TestClass);
        expect(metadata).toBe('third'); // Last decorator wins
    });
    it('should not set metadata when no decorators are used', () => {
        // Class without any decorators
        class TestClass {
            plainMethod() { }
        }
        const metadata = Reflect.getMetadata('auth', TestClass);
        expect(metadata).toBeUndefined();
    });
    it('should store metadata directly on class constructor', () => {
        // Verify metadata storage location
        class TestClass {
            method() { }
        }
        __decorate([
            (0, decorators_1.Auth)('direct-check'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method", null);
        const hasOwnMetadata = Reflect.hasOwnMetadata('auth', TestClass);
        expect(hasOwnMetadata).toBe(true);
    });
});
