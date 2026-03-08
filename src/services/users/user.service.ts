import type { UserModel } from '@/models/users/user.model'

import { get } from '@/services/baseService'

const endpoint = import.meta.env.VITE_USERS_ENDPOINT ?? '/users/users'

export function getAllUsers() {
  return get<UserModel[]>(endpoint)
}
