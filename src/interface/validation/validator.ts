import type { ValidationErrorOptions } from '@/interface/validation/class-validator'

export interface Validator<T = any> {
  validate(input: T): void | Promise<void>
}

export type ValidatorClass<T = any> = new () => T

export type ValidatorLike<T = any> = Validator<T> | ValidatorClass<T>

export type ValidatorDefinition<T = any> =
  | ValidatorLike<T>
  | {
      validator: ValidatorLike<T>
      error?: ValidationErrorOptions
    }
