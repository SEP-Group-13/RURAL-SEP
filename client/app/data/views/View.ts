import type { RequestOptions } from '../api/ApiConsumer'
import { createUniqueKey, isLabelInUse } from '../columns/columnHelpers'
import { PREDEFINED_FORMULAS } from '../columns/predefinedFormulas'
import type { PredefinedFormulaName } from '../columns/predefinedFormulas'
import { getPresetBands } from '../columns/presetBands'
import { PAGE_SIZE } from '../config'
import { validateBands } from '../pipeline/bands'
import { validateFilter } from '../pipeline/filters'
import { getReferencedColumnKeys, parseFormula, validateFormula } from '../pipeline/formula'
import type { RowSource } from '../rowSources/RowSource'
import type { Band, PresetBandName } from '../types/band'
import type { Column } from '../types/column'
import type { Filter } from '../types/filter'
import { failure, success } from '../types/result'
import type { ActionResult } from '../types/result'
import type { RowPage, ViewRow } from '../types/rows'
import type { SortDirection, SortRule, ViewQuery, ViewSettings, YearSelection } from '../types/view'
import { getQueryFromSettings } from './viewSettings'

const ID_COLUMN_KEY = 'participantId'

export type ViewListener = () => void

export class View {
  private settings: ViewSettings
  private rowSource: RowSource
  private listeners = new Set<ViewListener>()

  constructor(settings: ViewSettings, rowSource: RowSource) {
    this.settings = settings
    this.rowSource = rowSource
  }

  getId(): string {
    return this.settings.id
  }

  getName(): string {
    return this.settings.name
  }

  getSettings(): ViewSettings {
    return this.settings
  }

  getColumns(): Column[] {
    return this.settings.columns
  }

  getVisibleColumns(): Column[] {
    return this.settings.columns.filter((column) => column.visible)
  }

  getColumn(columnKey: string): Column | undefined {
    return this.settings.columns.find((column) => column.key === columnKey)
  }

  getFilters(): Filter[] {
    return this.settings.filters
  }

  getFilter(columnKey: string): Filter | undefined {
    return this.settings.filters.find((filter) => filter.columnKey === columnKey)
  }

  getSort(): SortRule | null {
    return this.settings.sort
  }

  getSelectedYears(): YearSelection {
    return this.settings.selectedYears
  }

  getExcludedIds(): string[] {
    return this.settings.excludedIds
  }

  toQuery(): ViewQuery {
    return getQueryFromSettings(this.settings)
  }

  getPage(pageNumber: number, options?: RequestOptions): Promise<RowPage> {
    return this.rowSource.getPage(PAGE_SIZE, pageNumber, this.toQuery(), options)
  }

  getAllRows(): Promise<ViewRow[]> {
    return this.rowSource.getAllRows(this.toQuery())
  }

  showColumn(columnKey: string): ActionResult {
    const column = this.getColumn(columnKey)
    if (column === undefined) {
      return failure(`Column [${columnKey}] does not exist in this view.`)
    }
    const others = this.settings.columns.filter((c) => c.key !== columnKey)
    this.update({ columns: [...others, { ...column, visible: true }] })
    return success()
  }

  hideColumn(columnKey: string): ActionResult {
    if (columnKey === ID_COLUMN_KEY) {
      return failure('The participant ID is always shown.')
    }
    const column = this.getColumn(columnKey)
    if (column === undefined) {
      return failure(`Column [${columnKey}] does not exist in this view.`)
    }
    this.replaceColumn({ ...column, visible: false })
    return success()
  }

  moveColumn(columnKey: string, newIndex: number): ActionResult {
    if (columnKey === ID_COLUMN_KEY) {
      return failure('The participant ID is always the first column.')
    }
    const visible = this.getVisibleColumns()
    const column = visible.find((c) => c.key === columnKey)
    if (column === undefined) {
      return failure(`Column [${columnKey}] is not shown, so it cannot be moved.`)
    }

    const reordered = visible.filter((c) => c.key !== columnKey)
    const safeIndex = Math.min(Math.max(1, Math.floor(newIndex)), reordered.length)
    reordered.splice(safeIndex, 0, column)

    const hidden = this.settings.columns.filter((c) => !c.visible)
    this.update({ columns: [...reordered, ...hidden] })
    return success()
  }

  removeColumn(columnKey: string): ActionResult {
    const column = this.getColumn(columnKey)
    if (column === undefined) {
      return failure(`Column [${columnKey}] does not exist in this view.`)
    }
    if (!column.removable) {
      return failure(`"${column.label}" is part of every view. You can hide it instead.`)
    }

    const removedKeys = new Set([columnKey])
    for (const other of this.settings.columns) {
      if (other.source.kind === 'band' && other.source.sourceColumnKey === columnKey) {
        removedKeys.add(other.key)
      }
    }

    const remaining = this.settings.columns.filter((c) => !removedKeys.has(c.key))
    const affectedFormulas = remaining.filter((c) => {
      if (c.source.kind !== 'formula') {
        return false
      }
      const parsed = parseFormula(c.source.expression)
      return parsed.ok && getReferencedColumnKeys(parsed.formula).includes(columnKey)
    })

    const sort = this.settings.sort
    this.update({
      columns: remaining,
      filters: this.settings.filters.filter((f) => !removedKeys.has(f.columnKey)),
      sort: sort !== null && removedKeys.has(sort.columnKey) ? null : sort,
    })

    if (affectedFormulas.length > 0) {
      const names = affectedFormulas.map((c) => `"${c.label}"`).join(', ')
      return success(`${names} used "${column.label}" and now show – until you edit them.`)
    }
    return success()
  }

  addFormulaColumn(label: string, expression: string, presetBands: PresetBandName | null = null): ActionResult {
    const key = createUniqueKey('formula', this.settings.columns)
    return this.addFormula(key, label, expression, presetBands)
  }

  addPredefinedFormula(name: PredefinedFormulaName): ActionResult {
    const predefined = PREDEFINED_FORMULAS[name]
    if (this.getColumn(predefined.key) !== undefined) {
      return failure(`"${predefined.label}" is already in this view.`)
    }
    return this.addFormula(predefined.key, predefined.label, predefined.expression, predefined.presetBands)
  }

  updateFormulaColumn(columnKey: string, label: string, expression: string): ActionResult {
    const column = this.getColumn(columnKey)
    if (column === undefined || column.source.kind !== 'formula') {
      return failure(`Column [${columnKey}] is not a formula in this view.`)
    }
    const labelError = this.checkNewLabel(label, columnKey)
    if (labelError !== null) {
      return failure(labelError)
    }
    const formulaError = validateFormula(expression, this.settings.columns, columnKey)
    if (formulaError !== null) {
      return failure(formulaError)
    }
    this.replaceColumn({
      ...column,
      label: label.trim(),
      source: { kind: 'formula', expression },
    })
    return success()
  }

  addSimulationColumn(label: string, value: number): ActionResult {
    const labelError = this.checkNewLabel(label, null)
    if (labelError !== null) {
      return failure(labelError)
    }
    if (!Number.isFinite(value)) {
      return failure('The simulation value must be a number.')
    }
    const column: Column = {
      key: createUniqueKey('simulation', this.settings.columns),
      label: label.trim(),
      dataType: 'number',
      group: 'Simulations',
      visible: true,
      removable: true,
      source: { kind: 'simulation', value },
    }
    this.update({ columns: [...this.settings.columns, column] })
    return success()
  }

  setSimulationValue(columnKey: string, value: number): ActionResult {
    const column = this.getColumn(columnKey)
    if (column === undefined || column.source.kind !== 'simulation') {
      return failure(`Column [${columnKey}] is not a simulation in this view.`)
    }
    if (!Number.isFinite(value)) {
      return failure('The simulation value must be a number.')
    }
    this.replaceColumn({ ...column, source: { kind: 'simulation', value } })
    return success()
  }

  addBandColumn(sourceColumnKey: string, bands: Band[]): ActionResult {
    const sourceColumn = this.getColumn(sourceColumnKey)
    if (sourceColumn === undefined || sourceColumn.dataType !== 'number') {
      return failure('Bands can only be added to a numeric column.')
    }
    const label = `${sourceColumn.label} band`
    const labelError = this.checkNewLabel(label, null)
    if (labelError !== null) {
      return failure(labelError)
    }
    const bandError = validateBands(bands)
    if (bandError !== null) {
      return failure(bandError)
    }
    const column = createBandColumn(
      createUniqueKey(`${sourceColumnKey}Band`, this.settings.columns),
      label,
      sourceColumnKey,
      cleanBands(bands),
      null,
    )
    this.update({ columns: [...this.settings.columns, column] })
    return success()
  }

  setBands(bandColumnKey: string, bands: Band[]): ActionResult {
    const column = this.getColumn(bandColumnKey)
    if (column === undefined || column.source.kind !== 'band') {
      return failure(`Column [${bandColumnKey}] is not a band column in this view.`)
    }
    const bandError = validateBands(bands)
    if (bandError !== null) {
      return failure(bandError)
    }
    this.replaceColumn({ ...column, source: { ...column.source, bands: cleanBands(bands) } })
    this.removeFilterOnChangedBands(bandColumnKey)
    return success()
  }

  resetBandsToPreset(bandColumnKey: string): ActionResult {
    const column = this.getColumn(bandColumnKey)
    if (column === undefined || column.source.kind !== 'band') {
      return failure(`Column [${bandColumnKey}] is not a band column in this view.`)
    }
    if (column.source.presetName === null) {
      return failure(`"${column.label}" has no preset bands.`)
    }
    const bands = getPresetBands(column.source.presetName)
    this.replaceColumn({ ...column, source: { ...column.source, bands } })
    this.removeFilterOnChangedBands(bandColumnKey)
    return success()
  }

  setFilter(filter: Filter): ActionResult {
    const error = validateFilter(filter, this.getColumn(filter.columnKey))
    if (error !== null) {
      return failure(error)
    }
    const others = this.settings.filters.filter((f) => f.columnKey !== filter.columnKey)
    this.update({ filters: [...others, filter] })
    return success()
  }

  removeFilter(columnKey: string): void {
    this.update({ filters: this.settings.filters.filter((f) => f.columnKey !== columnKey) })
  }

  clearFilters(): void {
    this.update({ filters: [] })
  }

  setSort(columnKey: string, direction: SortDirection): ActionResult {
    if (this.getColumn(columnKey) === undefined) {
      return failure(`Column [${columnKey}] does not exist in this view.`)
    }
    this.update({ sort: { columnKey, direction } })
    return success()
  }

  clearSort(): void {
    this.update({ sort: null })
  }

  resetColumn(columnKey: string): void {
    const sort = this.settings.sort
    this.update({
      filters: this.settings.filters.filter((f) => f.columnKey !== columnKey),
      sort: sort !== null && sort.columnKey === columnKey ? null : sort,
    })
  }

  setSelectedYears(years: YearSelection): void {
    if (years === 'all') {
      this.update({ selectedYears: 'all' })
      return
    }
    const uniqueSorted = [...new Set(years)].sort((a, b) => a - b)
    this.update({ selectedYears: uniqueSorted })
  }

  excludeParticipants(participantIds: string[]): void {
    const excluded = new Set([...this.settings.excludedIds, ...participantIds])
    this.update({ excludedIds: [...excluded] })
  }

  restoreParticipant(participantId: string): void {
    this.update({ excludedIds: this.settings.excludedIds.filter((id) => id !== participantId) })
  }

  restoreAllParticipants(): void {
    this.update({ excludedIds: [] })
  }

  subscribe(listener: ViewListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setName(name: string): void {
    this.update({ name })
  }

  private update(changes: Partial<ViewSettings>): void {
    this.settings = { ...this.settings, ...changes }
    for (const listener of this.listeners) {
      listener()
    }
  }

  private replaceColumn(changed: Column): void {
    const columns = this.settings.columns.map((c) => (c.key === changed.key ? changed : c))
    this.update({ columns })
  }

  private checkNewLabel(label: string, ownKey: string | null): string | null {
    if (label.trim() === '') {
      return 'Enter a name for the column.'
    }
    if (isLabelInUse(label, this.settings.columns, ownKey)) {
      return `A column named "${label.trim()}" already exists in this view.`
    }
    return null
  }

  private addFormula(key: string, label: string, expression: string, presetBands: PresetBandName | null): ActionResult {
    const labelError = this.checkNewLabel(label, null)
    if (labelError !== null) {
      return failure(labelError)
    }
    const formulaError = validateFormula(expression, this.settings.columns, null)
    if (formulaError !== null) {
      return failure(formulaError)
    }

    const newColumns: Column[] = [
      {
        key,
        label: label.trim(),
        dataType: 'number',
        group: 'Burden formulas',
        visible: true,
        removable: true,
        source: { kind: 'formula', expression },
      },
    ]
    if (presetBands !== null) {
      newColumns.push(
        createBandColumn(`${key}Band`, `${label.trim()} band`, key, getPresetBands(presetBands), presetBands),
      )
    }
    this.update({ columns: [...this.settings.columns, ...newColumns] })
    return success()
  }

  private removeFilterOnChangedBands(bandColumnKey: string): void {
    if (this.getFilter(bandColumnKey) !== undefined) {
      this.removeFilter(bandColumnKey)
    }
  }
}

function createBandColumn(
  key: string,
  label: string,
  sourceColumnKey: string,
  bands: Band[],
  presetName: PresetBandName | null,
): Column {
  return {
    key,
    label,
    dataType: 'category',
    group: 'Bands',
    visible: true,
    removable: true,
    source: { kind: 'band', sourceColumnKey, bands, presetName },
  }
}

function cleanBands(bands: Band[]): Band[] {
  return bands.map((band) => ({ label: band.label.trim(), below: band.below }))
}
