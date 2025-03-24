export type UseCase<Input, Output> = {
    execute(input: Input): Promise<Output>
}
