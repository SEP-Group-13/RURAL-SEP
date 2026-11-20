export type CellValue = number | string | null

export interface ViewRow {
  participantId: string

  /**
   * Keyed by column key. A band column has one cell per year, keyed `<bandKey>:<year>`
   * (see `bandCellKey`), because bands are assigned per calendar year.
   */
  cells: Record<string, CellValue>
}

export interface RowPage {
  rows: ViewRow[]

  pageNumber: number
  pageSize: number

  totalRows: number

  totalPages: number

  /** For each band column key, the years the server returned, in column order. */
  bandYears: Record<string, number[]>
}
