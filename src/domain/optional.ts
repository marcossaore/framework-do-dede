export type OptionalError = Error | string | (() => Error)

export class Optional<T> {
  private constructor(private readonly value: T | null | undefined) {}

  static of<T>(value: T): Optional<T> {
    if (value === null || value === undefined) {
      throw new Error('Optional.of() cannot be null or undefined')
    }
    return new Optional(value)
  }

  static ofNullable<T>(value: T | null | undefined): Optional<T> {
    return new Optional(value)
  }

  isPresent(): boolean {
    return this.value !== null && this.value !== undefined
  }

  isEmpty(): boolean {
    return !this.isPresent()
  }

  get(): T {
    if (!this.isPresent()) {
      throw new Error('Optional is empty')
    }
    return this.value as T
  }

  orElseNull(): T | null {
    return this.isPresent() ? (this.value as T) : null
  }

  orElseUndefined(): T | undefined {
    return this.isPresent() ? (this.value as T) : undefined
  }

  orElseThrow(error?: OptionalError): T {
    if (this.isPresent()) {
      return this.value as T
    }

    if (typeof error === 'function') {
      throw error()
    }

    if (typeof error === 'string') {
      throw new Error(error)
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Optional is empty')
  }
}
