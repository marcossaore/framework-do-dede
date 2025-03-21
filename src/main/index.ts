import { Auth, Controller, Get, Inject, Middleware, Post, Validator } from "@/decorators";
import ControllerHandler from "@/handlers/controller.handler";
import { UseCaseHandler } from "@/handlers/usecase.handler";
import HttpServer from "@/http/HttpServer";
import { BadRequest } from "@/http/ServerError";
import type { HttpMiddleware } from "@/protocols/HttpMiddleware";
import type { UseCase } from "@/protocols/UseCase";
import type Validation from "@/protocols/Validation";
import { Registry } from "@/di/registry";
import Elysia from "elysia";

Registry.register('controllers', []);


class ValidateUser implements Validation {
    validate(input: any) {
        if (!input.name) {
            throw new BadRequest('name is required')
        }
        return input
    }
}


class UserAuth implements HttpMiddleware {
    async execute(input: any) {
        return {
            auth: true
        }
    }
}

class Test implements HttpMiddleware {
    async execute(input: any) {
        return {
            test: true
        }
    }
}

type Input = { name: string, age: number, email: string, password: string };
type Output = void;

interface UserRepository {
    create: (input: any) => Promise<void>
}

class UserRepositoryDatabase implements UserRepository {
    async create(data: any): Promise<void> {
        console.log('creating user', data)
    }
}

Registry.register('UserRepository', Registry.classLoader(UserRepositoryDatabase))

class CreateUser implements UseCase<Input, Output> {
    @Auth() 
    private auth: any;

    constructor(
        @Inject('UserRepository') 
        private readonly userRepository: UserRepository
    ) {}
    
    async execute(input: Input): Promise<Output> {
        this.userRepository.create(input)
    }

}

class GetUser implements UseCase<Input, Output> {

    @Auth()
    private auth!: boolean

    constructor(
        @Inject('UserRepository') 
        private readonly userRepository: UserRepository
    ) {}
    
    async execute(input: Input): Promise<Output> {
        console.log(' testing', this.auth)
        await this.userRepository.create(input)
    }

}

type RequestData = {
    headers: any,
    data: any,
    middlewareData: any
}


@Controller('/users')
class UserController {
    
    @Post({ statusCode: 201 })
    @Validator(ValidateUser)
    @Middleware(UserAuth)
    // @Middleware(Test)
    createUser(input: any, request: RequestData) {
        console.log('request', request)
        return UseCaseHandler.load(CreateUser, request).execute(input)
    }

    @Get({ query: ['time|string'], statusCode: 200 })
    @Middleware(UserAuth)
    // @Middleware(Test)
    getUser(input: any, request: RequestData) {
        console.log('middlewareData', request.middlewareData)
        return UseCaseHandler.load(GetUser, request).execute(input)
    }
}


class ExpressHttpServer extends HttpServer {
    constructor() {
        super(new Elysia(), 'elysia')
    }


    listen(port: number): void {
        super.listen(port)
        console.log(`Server listening on port ${port}`)
    }
}

const server = new ExpressHttpServer()
new ControllerHandler(server, 3000)