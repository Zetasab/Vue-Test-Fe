import type { GenreModel } from '@/models/games/genre.model'

import { del, get, post, put } from '@/services/baseService'

const endpoint = '/games/genres'

export function getAllGenres() {
  return get<GenreModel[]>(endpoint)
}

export function getGenreById(id: string) {
  return get<GenreModel>(`${endpoint}/${id}`)
}

export function insertGenre(model: GenreModel) {
  return post<GenreModel, GenreModel>(endpoint, model)
}

export function updateGenre(id: string, model: GenreModel) {
  return put<void, GenreModel>(`${endpoint}/${id}`, model)
}

export function deleteGenre(id: string) {
  return del<void>(`${endpoint}/${id}`)
}
