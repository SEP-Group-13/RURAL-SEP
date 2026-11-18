export interface SearchMatch {
  participantId: string
  name: string | null
}

export interface SearchResult {
  total: number
  participants: SearchMatch[]
}
