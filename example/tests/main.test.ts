import axios from 'axios'
import { Dede } from "../../src/dede";
import '../express_app/example.controller';

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

describe("express app", () => {
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
        const { data, status } = await axios.post(`${expressEndpoint}/example`, {
            name: 'any_name',
            email: 'any_email'
        })
        expect(data.message).toBe("Hello from ExampleUseCase! any_name any_email")
        expect(status).toBe(201)
    })

    it("should call getExample - GET", async () => {
        const { data, status } = await axios.get(`${expressEndpoint}/example`)
        expect(data.message).toBe("Hello from ExampleUseCase!")
        expect(status).toBe(200)
    })

    it("should call putExample - PUT", async () => {
        const { data, status } = await axios.put(`${expressEndpoint}/example/5?test=ok`, {
        },
            {
                headers: {
                    'x-type': 'any-type'
                }
            }
        )
        console.log(data)
        expect(data.same['x-type']).toBe("any-type")
        expect(data.same.id).toBe("5")
        expect(data.same.test).toBe("ok")
        expect(data.context.id).toBe(123)
        expect(data.context.name).toBe('John Doe')
        expect(status).toBe(201)
    })

    it("should call deleteExample - DELETE", async () => {
        const { data } = await axios.delete(`${expressEndpoint}/example`)
        expect(data.id).toBe('hash_id')
        expect(data.auth).toBe(true)
        expect(data.name).toBe('John Doe')
    })
});

describe("elysia app", () => {
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
        const { data, status } = await axios.post(`${expressEndpoint}/example`, {
            name: 'any_name',
            email: 'any_email'
        })
        expect(data.message).toBe("Hello from ExampleUseCase! any_name any_email")
        expect(status).toBe(201)
    })

    it("should call getExample - GET", async () => {
        const { data, status } = await axios.get(`${expressEndpoint}/example`)
        expect(data.message).toBe("Hello from ExampleUseCase!")
        expect(status).toBe(200)
    })

    it("should call putExample - PUT", async () => {
        const { data, status } = await axios.put(`${expressEndpoint}/example/5?test=ok`, {
        },
            {
                headers: {
                    'x-type': 'any-type'
                }
            }
        )
        expect(data.same['x-type']).toBe("any-type")
        expect(data.same.id).toBe("5")
        expect(data.same.test).toBe("ok")
        expect(data.context.id).toBe(123)
        expect(data.context.name).toBe('John Doe')
        expect(status).toBe(201)
    })

    it("should call deleteExample - DELETE", async () => {
        const { data } = await axios.delete(`${expressEndpoint}/example`)
        expect(data.id).toBe('hash_id')
        expect(data.auth).toBe(true)
        expect(data.name).toBe('John Doe')
    })
});
