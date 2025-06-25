import { UseCase } from "../../src/application/usecase";

export class Example2UseCase extends UseCase<void, { message: string }> {
    async execute() {
        return { message: `Hello from ExampleUseCase!` };
    }
} 