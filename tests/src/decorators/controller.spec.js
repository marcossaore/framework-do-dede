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
const registry_1 = require("@/di/registry");
const decorators_1 = require("@/decorators");
describe('Controller Decorators', () => {
    beforeEach(() => {
        registry_1.Registry.clear('controllers');
        registry_1.Registry.register('controllers', []);
    });
    describe('@controller', () => {
        it('should register controller and set basePath metadata', () => {
            let UserController = class UserController {
            };
            UserController = __decorate([
                (0, decorators_1.Controller)('/users')
            ], UserController);
            const controllers = registry_1.Registry.resolve('controllers');
            expect(controllers).toContain(UserController);
            expect(Reflect.getMetadata('basePath', UserController)).toBe('/users');
        });
        it('should accumulate multiple controllers', () => {
            let AuthController = class AuthController {
            };
            AuthController = __decorate([
                (0, decorators_1.Controller)('/auth')
            ], AuthController);
            let ProductController = class ProductController {
            };
            ProductController = __decorate([
                (0, decorators_1.Controller)('/products')
            ], ProductController);
            const controllers = registry_1.Registry.resolve('controllers');
            expect(controllers).toHaveLength(2);
        });
    });
    describe('HTTP Method Decorators', () => {
        const testCases = [
            {
                decorator: decorators_1.Post,
                method: 'post',
                config: {
                    path: '/custom',
                    statusCode: 201,
                    params: ['id'],
                    query: ['filter']
                }
            },
            {
                decorator: decorators_1.Get,
                method: 'get',
                config: { path: '/list' }
            },
            {
                decorator: decorators_1.Put,
                method: 'put',
                config: { statusCode: 204 }
            },
            {
                decorator: decorators_1.Delete,
                method: 'delete',
                config: {}
            }
        ];
        test.each(testCases)('$method should set metadata correctly', ({ decorator, method, config }) => {
            let TestController = class TestController {
                testMethod() { }
            };
            __decorate([
                decorator(config),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], TestController.prototype, "testMethod", null);
            TestController = __decorate([
                (0, decorators_1.Controller)('/api')
            ], TestController);
            const metadata = Reflect.getMetadata('route', TestController.prototype, 'testMethod');
            expect(metadata).toMatchObject({
                method,
                path: config.path || '',
                statusCode: config.statusCode || 200,
                params: config.params || undefined,
                query: config.query || undefined
            });
        });
        it('should handle multiple methods in same controller', () => {
            let MultiController = class MultiController {
                create() { }
                list() { }
            };
            __decorate([
                (0, decorators_1.Post)({ path: '/create' }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], MultiController.prototype, "create", null);
            __decorate([
                (0, decorators_1.Get)({ path: '/list' }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], MultiController.prototype, "list", null);
            MultiController = __decorate([
                (0, decorators_1.Controller)('/multi')
            ], MultiController);
            const postMetadata = Reflect.getMetadata('route', MultiController.prototype, 'create');
            const getMetadata = Reflect.getMetadata('route', MultiController.prototype, 'list');
            expect(postMetadata.method).toBe('post');
            expect(getMetadata.method).toBe('get');
        });
        it('should use default values when config omitted', () => {
            class DefaultController {
                fetch() { }
            }
            __decorate([
                (0, decorators_1.Get)(),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], DefaultController.prototype, "fetch", null);
            const metadata = Reflect.getMetadata('route', DefaultController.prototype, 'fetch');
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
            let EmptyPathController = class EmptyPathController {
            };
            EmptyPathController = __decorate([
                (0, decorators_1.Controller)('')
            ], EmptyPathController);
            expect(Reflect.getMetadata('basePath', EmptyPathController)).toBe('');
        });
        it('should throw when adding to non-array controllers', () => {
            registry_1.Registry.clear('controllers');
            registry_1.Registry.register('controllers', {});
            expect(() => {
                let InvalidController = class InvalidController {
                };
                InvalidController = __decorate([
                    (0, decorators_1.Controller)('/invalid')
                ], InvalidController);
            }).toThrowError('Dependency must be an array');
        });
    });
});
describe('validation decorator', () => {
    it('should attach metadata with a validation instance when validationClass is valid', () => {
        class Validate {
            validate() {
                return true;
            }
        }
        class TestClass {
            someMethod() { }
        }
        __decorate([
            (0, decorators_1.Validator)(Validate),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "someMethod", null);
        const metadata = Reflect.getMetadata('validation', TestClass.prototype, 'someMethod');
        expect(metadata).toBeInstanceOf(Validate);
    });
});
