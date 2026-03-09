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

describe('HttpServer response serialization', () => {
    it('applies useHeaders and custom mime type on express', async () => {
        let registeredHandler: CallableFunction | undefined;
        const expressFramework = {
            listen: jest.fn(),
            use: jest.fn(),
            get: jest.fn((_route: string, handler: CallableFunction) => {
                registeredHandler = handler;
            }),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
        };

        class ExpressHttpServer extends HttpServer {
            async close(): Promise<void> {
                return;
            }
            constructor() {
                super(expressFramework as any, 'express');
            }
        }

        const handler = jest.fn(async () => Buffer.from([1, 2, 3]));
        const server = new ExpressHttpServer();
        server.register(
            {
                method: 'get',
                route: '/download',
                statusCode: 200,
                handler: { instance: {}, methodName: 'download' },
                responseType: 'application/octet-stream',
                useHeaders: {
                    'Content-Disposition': 'attachment; filename="file.bin"',
                    'Cache-Control': 'public, max-age=31536000'
                }
            },
            handler
        );

        const response = {
            status: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            type: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        await registeredHandler?.(
            {
                headers: {
                    host: 'some-url.com',
                    'x-forwarded-proto': 'https'
                },
                protocol: 'http',
                query: {},
                params: {},
                body: {},
                ip: '127.0.0.1'
            },
            response
        );

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            host: 'https://some-url.com'
        }));
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.set).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="file.bin"');
        expect(response.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
        expect(response.type).toHaveBeenCalledWith('application/octet-stream');
        expect(response.send).toHaveBeenCalledWith(Buffer.from([1, 2, 3]));
    });

    it('applies useHeaders and custom mime type on elysia', async () => {
        let registeredHandler: CallableFunction | undefined;
        const elysiaFramework = {
            server: {
                requestIP: () => ({ address: '127.0.0.1' })
            },
            listen: jest.fn(),
            use: jest.fn(),
            get: jest.fn((_route: string, handler: CallableFunction) => {
                registeredHandler = handler;
            }),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
        };

        class ElysiaHttpServer extends HttpServer {
            async close(): Promise<void> {
                return;
            }
            constructor() {
                super(elysiaFramework as any, 'elysia');
            }
        }

        const handler = jest.fn(async () => Buffer.from([1, 2, 3]));
        const server = new ElysiaHttpServer();
        server.register(
            {
                method: 'get',
                route: '/download',
                statusCode: 200,
                handler: { instance: {}, methodName: 'download' },
                responseType: 'application/octet-stream',
                useHeaders: {
                    'Content-Disposition': 'attachment; filename="file.bin"',
                    'Cache-Control': 'public, max-age=31536000'
                }
            },
            handler
        );

        const set = { status: 0, headers: {} as Record<string, string> };
        const output = await registeredHandler?.({
            headers: {
                host: 'another-url.com.br',
                'x-forwarded-proto': 'https'
            },
            set,
            query: {},
            params: {},
            body: {},
            request: { url: 'http://localhost:3000/download' }
        });

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            host: 'https://another-url.com.br'
        }));
        expect(set.status).toBe(200);
        expect(set.headers['Content-Disposition']).toBe('attachment; filename="file.bin"');
        expect(set.headers['Cache-Control']).toBe('public, max-age=31536000');
        expect(set.headers['content-type']).toBe('application/octet-stream');
        expect(output).toEqual(Buffer.from([1, 2, 3]));
    });
});
