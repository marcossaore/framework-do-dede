import { UseCase } from "../../src/application/usecase";
import { Inject } from "../../src/infra/di/registry";

export class Example4UseCase extends UseCase<void, { id: string, name: string }> {

    @Inject('UserRepository')
    private readonly userRepository!: any

    async execute() {
        const data = await this.userRepository.findById("any_id")
        return data
    }
} 