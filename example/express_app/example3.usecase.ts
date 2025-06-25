import { UseCase } from "../../src/application/usecase";

export class Example3UseCase extends UseCase<void, { same: any }> {
    async execute() {
        return {
            same: this.getData(),
            context: this.getContext().auth.user
        };
    }
} 