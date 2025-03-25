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
const decorators_1 = require("@/decorators");
describe('Inject Decorator', () => {
    it('should record tokens for all decorated constructor parameters', () => {
        let TestClass = class TestClass {
            constructor(param1, param2) { }
        };
        TestClass = __decorate([
            __param(0, (0, decorators_1.Inject)('token1')),
            __param(1, (0, decorators_1.Inject)('token2')),
            __metadata("design:paramtypes", [Object, Object])
        ], TestClass);
        const injections = Reflect.getMetadata('injections', TestClass);
        expect(injections).toEqual(['token1', 'token2']);
    });
    it('should handle sparse decorated parameters', () => {
        let TestClass = class TestClass {
            constructor(undecoratedParam, decoratedParam, anotherUndecorated, lastDecorated) { }
        };
        TestClass = __decorate([
            __param(1, (0, decorators_1.Inject)('token1')),
            __param(3, (0, decorators_1.Inject)('token3')),
            __metadata("design:paramtypes", [Object, Object, Object, Object])
        ], TestClass);
        const injections = Reflect.getMetadata('injections', TestClass);
        expect(injections).toHaveLength(4);
        expect(injections[1]).toBe('token1');
        expect(injections[3]).toBe('token3');
        expect(injections[0]).toBeUndefined();
        expect(injections[2]).toBeUndefined();
    });
    it('should not create metadata when no parameters are decorated', () => {
        class TestClass {
            constructor(plainParam) { }
        }
        const injections = Reflect.getMetadata('injections', TestClass);
        expect(injections).toBeUndefined();
    });
    it('(unexpectedly) stores method parameters on prototype', () => {
        class TestClass {
            method(param) { }
        }
        __decorate([
            __param(0, (0, decorators_1.Inject)('methodToken')),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object]),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "method", null);
        const injections = Reflect.getMetadata('injections', TestClass.prototype);
        expect(injections).toEqual(['methodToken']);
    });
});
