export interface Validator<T = any> {
  validate(input: T): void | Promise<void>
}

export type ValidatorClass<T = any> = new () => T

export type ValidatorLike<T = any> = Validator<T> | ValidatorClass<T>
