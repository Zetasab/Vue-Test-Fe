import type { DeveloperModel } from '@/models/games/developer.model'

import { del, get, post, put } from '@/services/baseService'

const endpoint = '/games/developers'

export function getAllDevelopers() {
  return get<DeveloperModel[]>(endpoint)
}

export function getDeveloperById(id: string) {
  return get<DeveloperModel>(`${endpoint}/${id}`)
}

export function insertDeveloper(model: DeveloperModel) {
  return post<DeveloperModel, DeveloperModel>(endpoint, model)
}

export function updateDeveloper(id: string, model: DeveloperModel) {
  return put<void, DeveloperModel>(`${endpoint}/${id}`, model)
}

export function deleteDeveloper(id: string) {
  return del<void>(`${endpoint}/${id}`)
}
