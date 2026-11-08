export type CellValue = number | string | null

export interface ViewRow {
  participantId: string

  cells: Record<string, CellValue>
}

export interface RowPage {
  rows: ViewRow[]

  pageNumber: number
  pageSize: number

  totalRows: number

  totalPages: number
}
