import { CustomServerError } from '@/http/errors/server'
import { plainToInstance } from 'class-transformer'
import type { ValidationError, ValidatorOptions } from 'class-validator'
import { validate } from 'class-validator'

export type ValidationErrorMap = Record<string, string[]>

export type ValidationErrorOptions = {
  statusCode?: number
  errorName?: string
  validatorOptions?: ValidatorOptions
}

export async function validateWithClassValidator<T extends object>(
  dtoClass: new () => T,
  input: T,
  options: ValidationErrorOptions = {}
): Promise<T> {
  const instance = plainToInstance(dtoClass, input)
  const validatorOptions: ValidatorOptions = {
    forbidUnknownValues: false,
    ...(options.validatorOptions ?? {})
  }
  const errors = await validate(instance, validatorOptions)
  if (errors.length === 0) return instance

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
