import { CustomServerError } from '@/http/errors/server'
import type { ValidationError } from 'class-validator'
import { validate } from 'class-validator'

export type ValidationErrorMap = Record<string, string[]>

export type ValidationErrorOptions = {
  statusCode?: number
  errorName?: string
}

export async function validateWithClassValidator<T extends object>(
  dtoClass: new () => T,
  input: T,
  options: ValidationErrorOptions = {}
): Promise<void> {
  const instance = Object.assign(new dtoClass(), input)
  const errors = await validate(instance)
  if (errors.length === 0) return

  const details = flattenErrors(errors)
  const statusCode = options.statusCode ?? 400
  const errorName = options.errorName ?? 'BadRequest'
  throw new CustomServerError(
    { errors: details },
    statusCode,
    errorName
  )
}

function flattenErrors(errors: ValidationError[], parentPath = ''): ValidationErrorMap {
  const output: ValidationErrorMap = {}
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property
    if (error.constraints) {
      output[path] = Object.values(error.constraints)
    }
    if (error.children && error.children.length > 0) {
      Object.assign(output, flattenErrors(error.children, path))
    }
  }
  return output
}
