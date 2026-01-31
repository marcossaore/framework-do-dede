import { UnprocessableEntity } from '@/domain/errors/http-errors'
import type { ValidationError } from 'class-validator'
import { validate } from 'class-validator'

export type ValidationErrorDetail = {
  path: string
  message: string
  rule: string
}

export async function validateWithClassValidator<T extends object>(dtoClass: new () => T, input: T): Promise<void> {
  const instance = Object.assign(new dtoClass(), input)
  const errors = await validate(instance)
  if (errors.length === 0) return

  const details = flattenErrors(errors)
  throw new UnprocessableEntity('Validation error', {
    code: 'validation_error',
    details
  })
}

function flattenErrors(errors: ValidationError[], parentPath = ''): ValidationErrorDetail[] {
  const output: ValidationErrorDetail[] = []
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property
    if (error.constraints) {
      for (const [rule, message] of Object.entries(error.constraints)) {
        output.push({ path, rule, message })
      }
    }
    if (error.children && error.children.length > 0) {
      output.push(...flattenErrors(error.children, path))
    }
  }
  return output
}
