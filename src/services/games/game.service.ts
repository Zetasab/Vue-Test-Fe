import type { GameModel } from '@/models/games/game.model'
import type { GamePaginationResponse } from '@/models/games/game-pagination-response.model'

import { del, get, post, put } from '@/services/baseService'

export type GameSearchParams = {
  page: number
  pageSize: number
  title?: string | null
  description?: string | null
  releaseDate?: string | Date | null
  platformId?: string | null
  developerId?: string | null
  tagIds?: string | null
  genreIds?: string | null
  reviewIds?: string | null
}

const endpoint = '/games/games'

export function getAllGames() {
  return get<GameModel[]>(endpoint)
}

export function getGameById(id: string) {
  return get<GameModel>(`${endpoint}/${id}`)
}

export function insertGame(model: GameModel) {
  return post<GameModel, GameModel>(endpoint, model)
}

export function updateGame(id: string, model: GameModel) {
  return put<void, GameModel>(`${endpoint}/${id}`, model)
}

export function deleteGame(id: string) {
  return del<void>(`${endpoint}/${id}`)
}

export function searchGames(params: GameSearchParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  appendQueryParam(query, 'title', params.title)
  appendQueryParam(query, 'description', params.description)
  appendQueryParam(query, 'releaseDate', toDateQueryValue(params.releaseDate))
  appendQueryParam(query, 'platformId', params.platformId)
  appendQueryParam(query, 'developerId', params.developerId)
  appendQueryParam(query, 'tagIds', params.tagIds)
  appendQueryParam(query, 'genreIds', params.genreIds)
  appendQueryParam(query, 'reviewIds', params.reviewIds)

  return get<GamePaginationResponse>(`${endpoint}/search?${query.toString()}`)
}

function appendQueryParam(query: URLSearchParams, key: string, value: string | null | undefined): void {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return
  }

  query.set(key, trimmedValue)
}

function toDateQueryValue(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue || null
  }

  if (Number.isNaN(value.getTime())) {
    return null
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
