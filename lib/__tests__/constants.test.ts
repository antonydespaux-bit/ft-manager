import { describe, it, expect } from 'vitest'
import { convertirUnite } from '../constants'

describe('convertirUnite', () => {
  it('converts g to kg', () => {
    expect(convertirUnite(1000, 'g', 'kg')).toBe(1)
  })

  it('converts kg to g', () => {
    expect(convertirUnite(2, 'kg', 'g')).toBe(2000)
  })

  it('converts cl to L', () => {
    expect(convertirUnite(100, 'cl', 'L')).toBe(1)
  })

  it('converts L to cl', () => {
    expect(convertirUnite(1, 'L', 'cl')).toBe(100)
  })

  it('converts ml to L', () => {
    expect(convertirUnite(1500, 'ml', 'L')).toBe(1.5)
  })

  it('converts L to ml', () => {
    expect(convertirUnite(0.5, 'L', 'ml')).toBe(500)
  })

  it('converts ml to cl', () => {
    expect(convertirUnite(100, 'ml', 'cl')).toBe(10)
  })

  it('converts cl to ml', () => {
    expect(convertirUnite(5, 'cl', 'ml')).toBe(50)
  })

  it('returns same quantity for same unit', () => {
    expect(convertirUnite(42, 'kg', 'kg')).toBe(42)
  })

  it('returns null for incompatible units', () => {
    expect(convertirUnite(1, 'kg', 'L')).toBeNull()
    expect(convertirUnite(1, 'pièce', 'kg')).toBeNull()
  })
})
