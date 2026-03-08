import type { ReviewModel } from '@/models/games/review.model'

import { del, get, post, put } from '@/services/baseService'

const endpoint = '/games/reviews'

export function getAllReviews() {
  return get<ReviewModel[]>(endpoint)
}

export function getReviewById(id: string) {
  return get<ReviewModel>(`${endpoint}/${id}`)
}

export function insertReview(model: ReviewModel) {
  return post<ReviewModel, ReviewModel>(endpoint, model)
}

export function updateReview(id: string, model: ReviewModel) {
  return put<void, ReviewModel>(`${endpoint}/${id}`, model)
}

export function deleteReview(id: string) {
  return del<void>(`${endpoint}/${id}`)
}
