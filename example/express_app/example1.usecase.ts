import { UseCase } from "../../src/application/usecase";

export class Example1UseCase extends UseCase<{ name: string, email: string }, { message: string }> {
    async execute() {
        const { name, email } = this.data!;
        return { message: `Hello from ExampleUseCase! ${name} ${email}` };
    }
} 