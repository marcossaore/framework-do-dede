import { type Middleware, type Input } from "../../src/application";

export class ExampleMiddleware implements Middleware {
    async execute(input: Input<any>): Promise<void> {
        input.context.auth = {
            user: {
                id: 123,
                name: 'John Doe'
            }
        }
    }
}