import type * as S from '@shared/api/generated/schemas'

// Requests: what the client sends (Zod input types)
export type ApiView = S.View
export type ApiFilter = S.Filter
export type QueryParticipantsRequest = S.QueryParticipantsRequest
export type CountChartRequest = S.CountChartRequest
export type HistogramRequest = S.HistogramRequest

// Responses: what the client receives after validation (Zod output types)
export type ParticipantPage = S.ParticipantPageOutput
export type ApiMeta = S.MetaOutput
export type ApiColumn = S.ColumnOutput
export type ApiParticipant = S.ParticipantOutput
export type ParticipantBurden = S.ParticipantBurdenOutput
export type ApiActivity = S.ActivityOutput
export type ParticipantSearchResult = S.ParticipantSearchResultOutput
export type BurdenPreset = S.BurdenPresetOutput
export type CountChartResponse = S.CountChartResponseOutput
export type HistogramResponse = S.HistogramResponseOutput
export type Problem = S.ProblemOutput
