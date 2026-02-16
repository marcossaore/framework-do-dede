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

    describe('mountRoute()', () => {
        const mount = (server: MockHttpServer, route: string, params?: string[]) => {
            return (server as any).mountRoute({ route, params } as HttpServerParams);
        };

        it('keeps static routes unchanged', () => {
            expect(mount(server, '/pets')).toBe('/pets');
            expect(mount(server, '/pets/ideias/:id')).toBe('/pets/ideias/:id');
            expect(mount(server, '/pets/example/noparams')).toBe('/pets/example/noparams');
        });

        it('does not duplicate params already present in path', () => {
            expect(mount(server, '/pets/:id', ['id'])).toBe('/pets/:id');
            expect(mount(server, '/pets/:id/services', ['id'])).toBe('/pets/:id/services');
            expect(mount(server, '/pets/:id/services/:serviceId', ['id', 'serviceId']))
                .toBe('/pets/:id/services/:serviceId');
        });

        it('appends missing params to the end of the route', () => {
            expect(mount(server, '/pets', ['id'])).toBe('/pets/:id');
            expect(mount(server, '/pets/:id/services', ['serviceId']))
                .toBe('/pets/:id/services/:serviceId');
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
