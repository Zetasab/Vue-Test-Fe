import type { TagModel } from '@/models/games/tag.model'

import { del, get, post, put } from '@/services/baseService'

const endpoint = '/games/tags'

export function getAllTags() {
  return get<TagModel[]>(endpoint)
}

export function getTagById(id: string) {
  return get<TagModel>(`${endpoint}/${id}`)
}

export function insertTag(model: TagModel) {
  return post<TagModel, TagModel>(endpoint, model)
}

export function updateTag(id: string, model: TagModel) {
  return put<void, TagModel>(`${endpoint}/${id}`, model)
}

export function deleteTag(id: string) {
  return del<void>(`${endpoint}/${id}`)
}
