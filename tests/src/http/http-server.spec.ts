import HttpServer, { HttpServerParams } from '@/http/http-server';

describe('HttpServer', () => {
    const mockFramework = {
        listen: jest.fn(),
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    };
    
    class MockHttpServer extends HttpServer {
        async close(): Promise<void> {
            console.log('close')
        }
        constructor() {
            super(mockFramework, 'elysia')
        }
    }
    let server: MockHttpServer;

    beforeEach(() => {
        jest.clearAllMocks();
        server = new MockHttpServer();
    });

    describe('Constructor', () => {
        it('should throw error if frameworkName is invalid', () => {
            class InvalidServer extends HttpServer {
                async close(): Promise<void> {
                    console.log('close')
                }
                protected frameworkName = 'elysia';
            }
            expect(() => new InvalidServer(mockFramework, 'invalid' as any)).toThrow('Framework not supported');
        });
    });

    describe('use()', () => {
        it('should add middleware to the framework', () => {
            const middleware = jest.fn();
            server.use(middleware);
            expect(mockFramework.use).toHaveBeenCalledWith(middleware);
        });
    });

    describe('register()', () => {
        it('should register route with correct parameters', () => {
            const params: HttpServerParams = {
                method: 'get',
                route: '/test',
                statusCode: 201,
                handler: {
                    instance: jest.fn(),
                    methodName: 'test',
                },
                responseType: 'json',
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

    describe('setDefaultMessageError() and getDefaultMessageError()', () => {
        it('should set default message error', () => {
            server.setDefaultMessageError('test');
            expect(server.getDefaultMessageError()).toBe('test');
        });
    });
});