import { parseFormula } from '../../pipeline/formula'
import type { FormulaNode, FormulaOperator } from '../../pipeline/formula'
import { MappingError } from './MappingError'

/**
 * Rewrites the column references in a formula, e.g. from frontend keys to API column names:
 *
 *     rewriteFormulaReferences('[radiationBurden] + [simulation1]', nameOf)
 *     // → '[Radiation burden (mSv)] + [Bone scan (mSv)]'
 *
 * The expression is parsed and printed again rather than edited as text, so a key that happens to
 * appear inside another key or in a number is never touched.
 */
export function rewriteFormulaReferences(expression: string, rename: (columnKey: string) => string): string {
  const parsed = parseFormula(expression)
  if (!parsed.ok) {
    throw new MappingError(`The formula "${expression}" is invalid: ${parsed.error}`)
  }
  return formatFormula(parsed.formula, rename)
}

/** Prints a parsed formula, adding only the parentheses needed to keep its meaning. */
export function formatFormula(node: FormulaNode, rename: (columnKey: string) => string): string {
  return print(node, rename, 0, false)
}

const PRECEDENCE: Record<FormulaOperator, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
const NEGATE_PRECEDENCE = 3

function print(node: FormulaNode, rename: (columnKey: string) => string, parentPrecedence: number, isRight: boolean): string {
  switch (node.type) {
    case 'number':
      return formatNumber(node.value)

    case 'reference': {
      const name = rename(node.columnKey)
      if (name.includes('[') || name.includes(']')) {
        throw new MappingError(`The column "${name}" is used in a formula, so its name cannot contain [ or ].`)
      }
      return `[${name}]`
    }

    case 'negate':
      return `-${print(node.operand, rename, NEGATE_PRECEDENCE, false)}`

    case 'operation': {
      const precedence = PRECEDENCE[node.operator]
      const text = `${print(node.left, rename, precedence, false)} ${node.operator} ${print(node.right, rename, precedence, true)}`
      // a - (b - c) and a / (b * c) need their parentheses; equal precedence on the right always keeps them.
      const needsParentheses = precedence < parentPrecedence || (isRight && precedence === parentPrecedence)
      return needsParentheses ? `(${text})` : text
    }
  }
}

/** Plain decimal notation: the formula syntax has no exponents (1e-7). */
function formatNumber(value: number): string {
  const text = String(value)
  if (!/e/i.test(text)) {
    return text
  }
  return value.toFixed(20).replace(/0+$/, '').replace(/\.$/, '')
}
