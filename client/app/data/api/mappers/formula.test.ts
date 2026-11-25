import { describe, expect, it } from 'vitest'
import { parseFormula } from '../../pipeline/formula'
import { rewriteFormulaReferences } from './formula'
import { MappingError } from './MappingError'

const upper = (key: string) => key.toUpperCase()
const same = (key: string) => key

describe('rewriteFormulaReferences', () => {
  it('renames every column reference', () => {
    expect(rewriteFormulaReferences('[a] + [b] * 2', upper)).toBe('[A] + [B] * 2')
  })

  it('renames by reference, not by text', () => {
    const names: Record<string, string> = { formula1: 'One', formula10: 'Ten' }
    expect(rewriteFormulaReferences('[formula1] + [formula10]', (key) => names[key] as string)).toBe('[One] + [Ten]')
  })

  it.each([
    ['[a] - ([b] - [c])', '[a] - ([b] - [c])'],
    ['([a] + [b]) * [c]', '([a] + [b]) * [c]'],
    ['[a] / ([b] * [c])', '[a] / ([b] * [c])'],
    ['[a] + [b] * [c]', '[a] + [b] * [c]'],
    ['([a] - [b]) - [c]', '[a] - [b] - [c]'],
    ['((([a])))', '[a]'],
    ['-([a] + 1)', '-([a] + 1)'],
    ['- -[a]', '--[a]'],
  ])('keeps the meaning of %s', (input, expected) => {
    const output = rewriteFormulaReferences(input, same)
    expect(output).toBe(expected)
    expect(parseFormula(output)).toEqual(parseFormula(input))
  })

  it('never writes numbers in exponent notation', () => {
    expect(rewriteFormulaReferences('[a] * 0.0000001', same)).toBe('[a] * 0.0000001')
  })

  it('rejects names that would break the bracket syntax', () => {
    expect(() => rewriteFormulaReferences('[a]', () => 'Dose [mSv]')).toThrow(MappingError)
  })

  it('rejects invalid formulas', () => {
    expect(() => rewriteFormulaReferences('[a] +', same)).toThrow(MappingError)
  })
})
