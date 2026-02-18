import { Optional } from '@/domain'

describe('Optional', () => {
  it('should wrap a present value', () => {
    const optional = Optional.of('value')
    expect(optional.isPresent()).toBe(true)
    expect(optional.isEmpty()).toBe(false)
    expect(optional.orElseNull()).toBe('value')
    expect(optional.orElseUndefined()).toBe('value')
  })

  it('should throw when Optional.of receives null or undefined', () => {
    expect(() => Optional.of(null as unknown as string)).toThrow('Optional.of() cannot be null or undefined')
    expect(() => Optional.of(undefined as unknown as string)).toThrow('Optional.of() cannot be null or undefined')
  })

  it('should allow empty Optional with ofNullable', () => {
    const fromNull = Optional.ofNullable<string>(null)
    const fromUndefined = Optional.ofNullable<string>(undefined)

    expect(fromNull.isPresent()).toBe(false)
    expect(fromUndefined.isPresent()).toBe(false)
    expect(fromNull.orElseNull()).toBeNull()
    expect(fromUndefined.orElseUndefined()).toBeUndefined()
  })

  it('should return value or throw with orElseThrow', () => {
    const optional = Optional.of(123)
    expect(optional.orElseThrow()).toBe(123)

    const empty = Optional.ofNullable<number>(null)
    expect(() => empty.orElseThrow()).toThrow('Optional is empty')
  })

  it('should throw custom errors in orElseThrow', () => {
    const empty = Optional.ofNullable<number>(undefined)

    expect(() => empty.orElseThrow('custom error')).toThrow('custom error')

    const error = new Error('boom')
    expect(() => empty.orElseThrow(error)).toThrow('boom')

    expect(() => empty.orElseThrow(() => new Error('factory error'))).toThrow('factory error')
  })
})
