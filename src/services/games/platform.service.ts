import type { PlatformModel } from '@/models/games/platform.model'

import { del, get, post, put } from '@/services/baseService'

const endpoint = '/games/platforms'

export function getAllPlatforms() {
  return get<PlatformModel[]>(endpoint)
}

export function getPlatformById(id: string) {
  return get<PlatformModel>(`${endpoint}/${id}`)
}

export function insertPlatform(model: PlatformModel) {
  return post<PlatformModel, PlatformModel>(endpoint, model)
}

export function updatePlatform(id: string, model: PlatformModel) {
  return put<void, PlatformModel>(`${endpoint}/${id}`, model)
}

export function deletePlatform(id: string) {
  return del<void>(`${endpoint}/${id}`)
}
