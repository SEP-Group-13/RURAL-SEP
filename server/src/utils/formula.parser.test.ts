import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FormulaSyntaxError, parseFormula } from './formula.parser.js'

test('evaluates the documented burden formula with different participant values', () => {
  const formula = parseFormula('[Time burden (min)] / 360 + [Radiation burden (mSv)] / 10')

  assert.deepEqual(formula.referencedColumns, ['Time burden (min)', 'Radiation burden (mSv)'])
  assert.equal(formula.evaluate({ 'Time burden (min)': 180, 'Radiation burden (mSv)': 20 }), 2.5)
  assert.equal(formula.evaluate({ 'Time burden (min)': 360, 'Radiation burden (mSv)': 0 }), 1)
})

test('respects operator precedence, left associativity, and unary signs', () => {
  assert.equal(parseFormula('1 + 2 * 3').evaluate({}), 7)
  assert.equal(parseFormula('20 / 5 / 2 - 3 - 1').evaluate({}), -2)
  assert.equal(parseFormula(' -(1 + 2) * - -2 + +.5 + 1e-2 ').evaluate({}), -5.49)
})

test('supports math.js functions, constants, and operators', () => {
  const formula = parseFormula('max(sqrt([dose]^2), 2[minimum]) + cos(pi) + (7 mod 3)')

  assert.equal(formula.evaluate({ dose: -6, minimum: 2 }), 6)
  assert.equal(formula.evaluate({ dose: 3, minimum: 4 }), 8)
})

test('matches column names exactly and reports each dependency once', () => {
  const formula = parseFormula('[ A-B ] + [é] + [ A-B ]')

  assert.deepEqual(formula.referencedColumns, [' A-B ', 'é'])
  assert.equal(formula.evaluate({ ' A-B ': 3, é: 1 }), 7)
  assert.equal(formula.evaluate({ 'A-B': 3, é: 1 }), null)
})

test('keeps brackets in strings and comments separate from column references', () => {
  const formula = parseFormula(`compareText('a [ignored]', "a [ignored]") == 0 ? [dose] : 0 # [also ignored]`)

  assert.deepEqual(formula.referencedColumns, ['dose'])
  assert.equal(formula.evaluate({ dose: 3 }), 3)
  assert.equal(parseFormula('[dose] + _ruralColumn0').evaluate({ dose: 3 }), null)
})

test('returns null for missing or nonnumeric values and division by zero', () => {
  const formula = parseFormula('[numerator] / ([denominator] - 1)')

  assert.equal(formula.evaluate({ numerator: 0, denominator: 2 }), 0)
  for (const denominator of [undefined, null, '2', NaN, Infinity, 1]) {
    assert.equal(formula.evaluate({ numerator: 2, denominator }), null)
  }
  assert.equal(parseFormula('0 / 0').evaluate({}), null)
  assert.equal(parseFormula('1 / (1 / 0)').evaluate({}), null)
  assert.equal(parseFormula('1 / (1 ./ 0)').evaluate({}), null)
  assert.equal(parseFormula('1 / 1e-50').evaluate({}), 1e50)
  assert.equal(parseFormula('1e308 * 10').evaluate({}), null)
  assert.equal(parseFormula('1e999').evaluate({}), null)
  assert.equal(parseFormula('3 > 2').evaluate({}), null)
  assert.equal(parseFormula('[constructor]').evaluate({}), null)
})

test('rejects malformed expressions and reports the offending position', () => {
  for (const expression of ['', '  ', '1+', '()', '(1', '1)', '[]', '[[x]', '[x', '1 2', '2**3', '1 /* 2 */ 3']) {
    assert.throws(() => parseFormula(expression), FormulaSyntaxError, expression)
  }
  assert.throws(() => parseFormula('1 + @'), { name: 'FormulaSyntaxError', position: 4 })
  const expression = '[x] + [Radiation burden (millisieverts)] + @'
  assert.throws(() => parseFormula(expression), { name: 'FormulaSyntaxError', position: expression.indexOf('@') })
})

test('keeps math configuration and participant values isolated from formulas', () => {
  assert.equal(parseFormula('config({number: "BigNumber"})').evaluate({}), null)
  assert.equal(parseFormula('2^3').evaluate({}), 8)

  const values = { dose: 12 }
  const formula = parseFormula('(x = [dose]) + 1')
  assert.equal(formula.evaluate(values), 13)
  assert.deepEqual(values, { dose: 12 })
  assert.equal(parseFormula('x').evaluate({}), null)
})
