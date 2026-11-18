import { dbMetaGetBurdenPresets, dbMetaGetColumns, dbMetaGetInfo } from '@/repositories/meta.repository.js'
import { GetMetaInfoResponse, GetMetaColumnsResponse, GetMetaBurdenPresetsResponse } from '@shared/api/generated/api.zod.js'

export const infoService = async () => {
  const fetchedInfo = await dbMetaGetInfo()

  const safeInfo = GetMetaInfoResponse.parse(fetchedInfo)

  return { info: safeInfo }
}

export const columnsService = async () => {
  const fetchedColumns = await dbMetaGetColumns()

  const safeColumns = GetMetaColumnsResponse.parse(fetchedColumns)

  return { columns: safeColumns }
}

export const burdenPresetsService = async () => {
  const fetchedBurdenPresets = await dbMetaGetBurdenPresets()

  const safeBurdenPresets = GetMetaBurdenPresetsResponse.parse(fetchedBurdenPresets)

  return { burdenPresets: safeBurdenPresets }
}