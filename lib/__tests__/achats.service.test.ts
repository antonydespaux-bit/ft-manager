import { describe, it, expect } from 'vitest'
import { normDesignation } from '../services/achats.service'

describe('normDesignation', () => {
  it('normalizes accented characters', () => {
    expect(normDesignation('Crème fraîche')).toBe('creme fraiche')
  })

  it('lowercases and trims', () => {
    expect(normDesignation('  TOMATES CERISES  ')).toBe('tomates cerises')
  })

  it('removes special characters', () => {
    expect(normDesignation("Bœuf (1kg) - premium")).toBe('b uf 1kg premium')
  })

  it('handles null/undefined', () => {
    expect(normDesignation(null)).toBe('')
    expect(normDesignation(undefined)).toBe('')
    expect(normDesignation('')).toBe('')
  })

  it('normalizes multiple spaces', () => {
    expect(normDesignation('tomates   cerises   bio')).toBe('tomates cerises bio')
  })
})
