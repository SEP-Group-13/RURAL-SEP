import { all, create, type MathJsInstance } from 'mathjs'

type ColumnValues = Readonly<Record<string, string | number | null | undefined>>

export interface ParsedFormula {
  readonly referencedColumns: readonly string[]
  evaluate(values: ColumnValues): number | null
}

export class FormulaSyntaxError extends SyntaxError {
  /** Zero-based offset in the original expression. */
  readonly position: number

  constructor(message: string, position: number) {
    super(`${message} at character ${position + 1}`)
    this.name = 'FormulaSyntaxError'
    this.position = position
  }
}

const math = create(all)
// math.js exposes this scalar operator at runtime but omits it from its TypeScript declarations.
const { divideScalar } = math as MathJsInstance & { divideScalar: { signatures: Parameters<typeof math.typed>[1] } }

function unavailable() {
  throw new Error('The dashboard math environment is read-only')
}

math.import({
  // Keep formula evaluation from changing the shared math environment or restoring objects.
  import: unavailable,
  createUnit: unavailable,
  reviver: unavailable,
  config: unavailable,
  divideScalar: math.typed('divideScalar', {
    ...divideScalar.signatures,
    'number,number': (left: number, right: number) => {
      if (right === 0) throw new RangeError('Division by zero')
      return left / right
    },
  }),
}, { override: true })

function bindColumns(expression: string) {
  const columns = new Map<string, string>()
  const replacements: { start: number; end: number; originalLength: number }[] = []
  let prefix = '_ruralColumn'
  while (expression.includes(prefix)) prefix += '_'

  let shift = 0
  // Leave quoted strings and comments intact. Square brackets outside them denote columns.
  const tokens = /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|#[^\r\n]*|\[([^[\]]+)\]|[[\]]/g
  const source = expression.replace(tokens, (token: string, column: string | undefined, offset: number) => {
    if (token.length === 1) throw new FormulaSyntaxError('Expected a column name in square brackets', offset)
    if (column === undefined) return token

    const symbol = columns.get(column) ?? `${prefix}${columns.size}`
    columns.set(column, symbol)

    const replacement = `(${symbol})`
    const start = offset + shift
    replacements.push({ start, end: start + replacement.length, originalLength: token.length })
    shift += replacement.length - token.length
    return replacement
  })

  function originalPosition(position: number) {
    let offset = position
    for (const { start, end, originalLength } of replacements) {
      if (position < start) break
      if (position < end) return offset - (position - start)
      offset += originalLength - (end - start)
    }
    return offset
  }

  return { source, columns, originalPosition }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Compile a burden formula once for use with each participant's numeric column values (URF 7.5). */
export function parseFormula(expression: string): ParsedFormula {
  if (!expression.trim()) throw new FormulaSyntaxError('Expected a formula', expression.length)
  const { source, columns, originalPosition } = bindColumns(expression)
  const compiled = (() => {
    try {
      return math.compile(source)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const position = error instanceof Error && 'char' in error && typeof error.char === 'number' ? error.char - 1 : 0
      throw new FormulaSyntaxError(message.replace(/ \(char \d+\)$/, ''), originalPosition(position))
    }
  })()

  return {
    referencedColumns: [...columns.keys()],
    evaluate(values) {
      const scope = new Map<string, number>()
      for (const [column, symbol] of columns) {
        const value = Object.hasOwn(values, column) ? values[column] : undefined
        if (!isFiniteNumber(value)) return null
        scope.set(symbol, value)
      }

      try {
        const result: unknown = compiled.evaluate(scope)
        return isFiniteNumber(result) ? result : null
      } catch {
        return null
      }
    },
  }
}
