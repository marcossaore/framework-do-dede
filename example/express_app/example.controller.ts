import { Controller, Delete, Get, Post, Put, UseMiddleware } from "../../src/application/controller";
import type { Request } from "../../src/http/http-server";
import { ExampleMiddleware } from "./example.middleware";
import { Example1UseCase } from "./example1.usecase";
import { Example2UseCase } from "./example2.usecase";
import { Example3UseCase } from "./example3.usecase";
import { Example4UseCase } from "./example4.usecase";

@Controller('/example')
export class ExampleController {

    @Post({ statusCode: 201 })
    async postExample(request: Request) {
        const useCase = new Example1UseCase(request);
        return await useCase.execute();
    }

    @Get({ statusCode: 200 })
    async getExample(request: Request) {
        const useCase = new Example2UseCase(request);
        return await useCase.execute();
    }

    @Put({ params: ['id|string'], query: ['test|string'], headers: ['x-type|string'], statusCode: 201 })
    @UseMiddleware(ExampleMiddleware)
    async putExample(request: Request) {
        const useCase = new Example3UseCase(request);
        return await useCase.execute();
    }

    @Delete({ statusCode: 200 })
    async deleteExample(request: Request) {
        const useCase = new Example4UseCase(request);
        return await useCase.execute();
    }
} 