import { Transform } from 'class-transformer'
import { IsDate, IsNotEmpty } from 'class-validator'

import { validateWithClassValidator } from '@/interface/validation/class-validator'

describe('validateWithClassValidator', () => {
  it('preserves non-mapped fields without transforming their values', async () => {
    class PetCreateValidator {
      @IsNotEmpty()
      name!: string

      @Transform(({ value }) => {
        if (typeof value !== 'string') return value
        const [year, month, day] = value.split('-').map(Number)
        return new Date(Date.UTC(year, month - 1, day))
      })
      @IsDate()
      birthDate!: Date
    }

    const photo = { name: 'photo.jpg', meta: { size: 123 } }
    const input = {
      name: 'Bob',
      birthDate: '2020-01-02',
      photo
    }

    const result = await validateWithClassValidator(PetCreateValidator, input)

    expect(result.birthDate).toBeInstanceOf(Date)
    expect(result.photo).toBe(photo)
  })
})
