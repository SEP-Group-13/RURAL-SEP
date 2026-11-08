import type { Column } from '../types/column'
import type { CellValue } from '../types/rows'

export type FormulaOperator = '+' | '-' | '*' | '/'

export interface NumberNode {
  type: 'number'
  value: number
}

export interface ReferenceNode {
  type: 'reference'
  columnKey: string
}

export interface OperationNode {
  type: 'operation'
  operator: FormulaOperator
  left: FormulaNode
  right: FormulaNode
}

export interface NegateNode {
  type: 'negate'
  operand: FormulaNode
}

export type FormulaNode = NumberNode | ReferenceNode | OperationNode | NegateNode

export interface ParseSuccess {
  ok: true
  formula: FormulaNode
}

export interface ParseFailure {
  ok: false
  error: string
}

export type ParseResult = ParseSuccess | ParseFailure

export function parseFormula(expression: string): ParseResult {
  if (expression.trim() === '') {
    return { ok: false, error: 'The formula is empty.' }
  }
  try {
    const reader: TokenReader = { tokens: splitIntoTokens(expression), index: 0 }
    const formula = readSum(reader)
    const leftOver = reader.tokens[reader.index]
    if (leftOver !== undefined) {
      throw new FormulaError(`Unexpected ${describeToken(leftOver)} at position ${leftOver.position}.`)
    }
    return { ok: true, formula }
  } catch (error) {
    if (error instanceof FormulaError) {
      return { ok: false, error: error.message }
    }
    throw error
  }
}

class FormulaError extends Error {}

interface NumberToken {
  type: 'number'
  value: number
  position: number
}

interface ReferenceToken {
  type: 'reference'
  columnKey: string
  position: number
}

interface SymbolToken {
  type: 'symbol'
  symbol: string
  position: number
}

type Token = NumberToken | ReferenceToken | SymbolToken

interface TokenReader {
  tokens: Token[]
  index: number
}

function splitIntoTokens(expression: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < expression.length) {
    const char = expression.charAt(i)
    const position = i + 1

    if (char === ' ' || char === '\t' || char === '\n') {
      i += 1
    } else if (isDigit(char) || char === '.') {
      let end = i
      while (end < expression.length && (isDigit(expression.charAt(end)) || expression.charAt(end) === '.')) {
        end += 1
      }
      const text = expression.slice(i, end)
      const value = Number(text)
      if (Number.isNaN(value)) {
        throw new FormulaError(`"${text}" at position ${position} is not a valid number.`)
      }
      tokens.push({ type: 'number', value, position })
      i = end
    } else if (char === '[') {
      const end = expression.indexOf(']', i)
      if (end === -1) {
        throw new FormulaError(`The [ at position ${position} has no closing ].`)
      }
      const columnKey = expression.slice(i + 1, end).trim()
      if (columnKey === '') {
        throw new FormulaError(`The [ ] at position ${position} has no column in it.`)
      }
      tokens.push({ type: 'reference', columnKey, position })
      i = end + 1
    } else if ('+-*/()'.includes(char)) {
      tokens.push({ type: 'symbol', symbol: char, position })
      i += 1
    } else {
      throw new FormulaError(`Unexpected character "${char}" at position ${position}.`)
    }
  }

  return tokens
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

function readSum(reader: TokenReader): FormulaNode {
  let node = readProduct(reader)
  while (nextSymbolIs(reader, '+') || nextSymbolIs(reader, '-')) {
    const operator = takeSymbol(reader)
    const right = readProduct(reader)
    node = { type: 'operation', operator, left: node, right }
  }
  return node
}

function readProduct(reader: TokenReader): FormulaNode {
  let node = readValue(reader)
  while (nextSymbolIs(reader, '*') || nextSymbolIs(reader, '/')) {
    const operator = takeSymbol(reader)
    const right = readValue(reader)
    node = { type: 'operation', operator, left: node, right }
  }
  return node
}

function readValue(reader: TokenReader): FormulaNode {
  const token = reader.tokens[reader.index]
  if (token === undefined) {
    throw new FormulaError('The formula ends too early. Is a number or column missing at the end?')
  }
  reader.index += 1

  if (token.type === 'number') {
    return { type: 'number', value: token.value }
  }
  if (token.type === 'reference') {
    return { type: 'reference', columnKey: token.columnKey }
  }
  if (token.symbol === '-') {
    return { type: 'negate', operand: readValue(reader) }
  }
  if (token.symbol === '(') {
    const inside = readSum(reader)
    if (!nextSymbolIs(reader, ')')) {
      throw new FormulaError(`The ( at position ${token.position} has no closing ).`)
    }
    reader.index += 1
    return inside
  }
  throw new FormulaError(`Unexpected ${describeToken(token)} at position ${token.position}.`)
}

function nextSymbolIs(reader: TokenReader, symbol: string): boolean {
  const token = reader.tokens[reader.index]
  return token !== undefined && token.type === 'symbol' && token.symbol === symbol
}

function takeSymbol(reader: TokenReader): FormulaOperator {
  const token = reader.tokens[reader.index] as SymbolToken
  reader.index += 1
  return token.symbol as FormulaOperator
}

function describeToken(token: Token): string {
  if (token.type === 'number') {
    return `number ${token.value}`
  }
  if (token.type === 'reference') {
    return `column [${token.columnKey}]`
  }
  return `"${token.symbol}"`
}

export function evaluateFormula(formula: FormulaNode, getValue: (columnKey: string) => CellValue): number | null {
  switch (formula.type) {
    case 'number':
      return formula.value

    case 'reference': {
      const value = getValue(formula.columnKey)
      return typeof value === 'number' ? value : null
    }

    case 'negate': {
      const value = evaluateFormula(formula.operand, getValue)
      return value === null ? null : -value
    }

    case 'operation': {
      const left = evaluateFormula(formula.left, getValue)
      const right = evaluateFormula(formula.right, getValue)
      if (left === null || right === null) {
        return null
      }
      const result = calculate(formula.operator, left, right)
      return Number.isFinite(result) ? result : null
    }
  }
}

function calculate(operator: FormulaOperator, left: number, right: number): number {
  switch (operator) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return right === 0 ? Number.NaN : left / right
  }
}

export function getReferencedColumnKeys(formula: FormulaNode): string[] {
  const keys = new Set<string>()
  collectKeys(formula, keys)
  return [...keys]
}

function collectKeys(formula: FormulaNode, keys: Set<string>): void {
  if (formula.type === 'reference') {
    keys.add(formula.columnKey)
  } else if (formula.type === 'negate') {
    collectKeys(formula.operand, keys)
  } else if (formula.type === 'operation') {
    collectKeys(formula.left, keys)
    collectKeys(formula.right, keys)
  }
}

export function validateFormula(expression: string, columns: Column[], ownKey: string | null): string | null {
  const parsed = parseFormula(expression)
  if (!parsed.ok) {
    return parsed.error
  }

  const usedKeys = getReferencedColumnKeys(parsed.formula)
  for (const key of usedKeys) {
    const column = columns.find((c) => c.key === key)
    if (column === undefined) {
      return `Column [${key}] does not exist in this view.`
    }
    if (column.dataType !== 'number') {
      return `Column [${key}] (${column.label}) is not a number, so it cannot be used in a formula.`
    }
  }

  if (ownKey !== null && usesColumn(usedKeys, ownKey, columns, new Set())) {
    return 'A formula cannot use itself, also not through another formula.'
  }

  return null
}

function usesColumn(keys: string[], targetKey: string, columns: Column[], checked: Set<string>): boolean {
  for (const key of keys) {
    if (key === targetKey) {
      return true
    }
    if (checked.has(key)) {
      continue
    }
    checked.add(key)

    const column = columns.find((c) => c.key === key)
    if (column !== undefined && column.source.kind === 'formula') {
      const parsed = parseFormula(column.source.expression)
      if (parsed.ok && usesColumn(getReferencedColumnKeys(parsed.formula), targetKey, columns, checked)) {
        return true
      }
    }
  }
  return false
}
