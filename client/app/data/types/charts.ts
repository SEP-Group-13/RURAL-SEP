export interface ChartBucket {
  label: string
  count: number
}

/** Participants per value of one view's column; for a band column, one series per selected year. */
export interface CountSeries {
  viewId: string
  /** Set for band columns (one series per selected year), null otherwise. */
  year: number | null
  /** Every value of the column, also those with a count of 0, in the server's order. */
  buckets: ChartBucket[]
}

export interface ChartCounts {
  columnKey: string
  series: CountSeries[]
}

export interface HistogramBin {
  /** The bin covers `lowerBound` up to, not including, `lowerBound + binWidth`. */
  lowerBound: number
  count: number
}

export interface HistogramSeries {
  viewId: string
  bins: HistogramBin[]
}

export interface Histogram {
  columnKey: string
  binWidth: number
  series: HistogramSeries[]
}
