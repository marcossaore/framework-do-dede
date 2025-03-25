"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HttpServer_1 = __importDefault(require("@/http/HttpServer"));
const mockFramework = {
    listen: jest.fn(),
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
};
class MockHttpServer extends HttpServer_1.default {
    constructor() {
        super(mockFramework, 'elysia');
    }
}
describe('HttpServer', () => {
    let server;
    beforeEach(() => {
        jest.clearAllMocks();
        server = new MockHttpServer();
    });
    describe('Constructor', () => {
        it('should throw error if frameworkName is invalid', () => {
            class InvalidServer extends HttpServer_1.default {
                constructor() {
                    super(...arguments);
                    this.frameworkName = 'elysia';
                }
            }
            expect(() => new InvalidServer(mockFramework, 'invalid')).toThrow('Framework not supported');
        });
    });
    describe('use()', () => {
        it('should add middleware to the framework', () => {
            const middleware = jest.fn();
            server.use(middleware);
            expect(mockFramework.use).toHaveBeenCalledWith(middleware);
        });
    });
    describe('mountRoute()', () => {
        it('should return base route without params', () => {
            const params = { method: 'get', route: '/test' };
            expect(server['mountRoute'](params)).toBe('/test');
        });
        it('should handle params with _ correctly', () => {
            const params = {
                method: 'get',
                route: '/users',
                params: ['_static1', '_static2'],
            };
            expect(server['mountRoute'](params)).toBe('/users/static1/static2');
        });
        it('should convert params to path variables', () => {
            const params = {
                method: 'get',
                route: '/api',
                params: ['id|number', 'name|string'],
            };
            expect(server['mountRoute'](params)).toBe('/api/:id/:name');
        });
    });
    describe('register()', () => {
        it('should register route with correct parameters', () => {
            const params = {
                method: 'get',
                route: '/test',
                statusCode: 201,
            };
            const handler = jest.fn();
            server.register(params, handler);
            expect(mockFramework.get).toHaveBeenCalledTimes(1);
        });
    });
    describe('listen()', () => {
        it('should start listening on specified port', () => {
            server.listen(3000);
            expect(mockFramework.listen).toHaveBeenCalledWith(3000);
        });
    });
});
