import { Dede } from "../../src/dede";
import '../express_app/example.controller';

type HttpResponse<T = any> = { data: T; status: number };

async function request<T = any>(
    method: string,
    url: string,
    body?: any,
    headers: Record<string, string> = {}
): Promise<HttpResponse<T>> {
    const response = await fetch(url, {
        method,
        headers: body ? { 'content-type': 'application/json', ...headers } : headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    return { data, status: response.status };
}

class UserRepository {
    async findById(id: string) {
        return {
            id: 'hash_id',
            auth: true,
            name: 'John Doe'
        }
    }
}

const expressEndpoint = 'http://localhost:3000'
const shouldRunExampleTests = process.env.RUN_EXAMPLE_TESTS === 'true';
const describeIf = shouldRunExampleTests ? describe : describe.skip;

describeIf("express app", () => {
    let expressApp!: Dede;
    beforeAll(async () => {
        expressApp = await Dede.start({
            framework: {
                use: 'express',
                port: 3000,
            },
            registries: [
                {
                    name: 'UserRepository',
                    classLoader: new UserRepository(),
                }
            ],
        })
        console.log('Express server running on port 3000');
    })

    afterAll(async () => {
        await expressApp.stop()
    })

    it("should be defined", async () => {
        expect(expressApp).toBeDefined();
    });

    it("should call postExample - POST", async () => {
        const { data, status } = await request('POST', `${expressEndpoint}/example`, {
            name: 'any_name',
            email: 'any_email'
        });
        expect(data.message).toBe("Hello from ExampleUseCase! any_name any_email")
        expect(status).toBe(201)
    })

    it("should call getExample - GET", async () => {
        const { data, status } = await request('GET', `${expressEndpoint}/example`)
        expect(data.message).toBe("Hello from ExampleUseCase!")
        expect(status).toBe(200)
    })

    it("should call putExample - PUT", async () => {
        const { data, status } = await request(
            'PUT',
            `${expressEndpoint}/example/5?test=ok`,
            {},
            { 'x-type': 'any-type' }
        );
        console.log(data)
        expect(data.same['x-type']).toBe("any-type")
        expect(data.same.id).toBe("5")
        expect(data.same.test).toBe("ok")
        expect(data.context.id).toBe(123)
        expect(data.context.name).toBe('John Doe')
        expect(status).toBe(201)
    })

    it("should call deleteExample - DELETE", async () => {
        const { data } = await request('DELETE', `${expressEndpoint}/example`)
        expect(data.id).toBe('hash_id')
        expect(data.auth).toBe(true)
        expect(data.name).toBe('John Doe')
    })
});

describeIf("elysia app", () => {
    let elysia!: Dede;
    beforeAll(async () => {
        elysia = await Dede.start({
            framework: {
                use: 'elysia',
                port: 3001,
            },
            registries: [
                {
                    name: 'UserRepository',
                    classLoader: new UserRepository(),
                }
            ],
        })
        console.log('Elysia server running on port 3000');
    })

    afterAll(async () => {
        await elysia.stop()
    })

    it("should be defined", async () => {
        expect(elysia).toBeDefined();
    });

    it("should call postExample - POST", async () => {
        const { data, status } = await request('POST', `${expressEndpoint}/example`, {
            name: 'any_name',
            email: 'any_email'
        });
        expect(data.message).toBe("Hello from ExampleUseCase! any_name any_email")
        expect(status).toBe(201)
    })

    it("should call getExample - GET", async () => {
        const { data, status } = await request('GET', `${expressEndpoint}/example`)
        expect(data.message).toBe("Hello from ExampleUseCase!")
        expect(status).toBe(200)
    })

    it("should call putExample - PUT", async () => {
        const { data, status } = await request(
            'PUT',
            `${expressEndpoint}/example/5?test=ok`,
            {},
            { 'x-type': 'any-type' }
        );
        expect(data.same['x-type']).toBe("any-type")
        expect(data.same.id).toBe("5")
        expect(data.same.test).toBe("ok")
        expect(data.context.id).toBe(123)
        expect(data.context.name).toBe('John Doe')
        expect(status).toBe(201)
    })

    it("should call deleteExample - DELETE", async () => {
        const { data } = await request('DELETE', `${expressEndpoint}/example`)
        expect(data.id).toBe('hash_id')
        expect(data.auth).toBe(true)
        expect(data.name).toBe('John Doe')
    })
});
