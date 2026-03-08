import { BaseEntity } from '@/models/base-entity.model'

import { UserRole } from '@/models/users/user-role.enum'

export class UserModel extends BaseEntity {
  username = ''
  passwordHash = ''
  token = ''
  role: UserRole = UserRole.User
  isActive = true
}
