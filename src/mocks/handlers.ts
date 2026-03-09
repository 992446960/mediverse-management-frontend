import { authHandlers } from './handlers/auth'
import { organizationHandlers } from './handlers/organizations'
import { departmentHandlers } from './handlers/departments'
import { userHandlers } from './handlers/users'
import { avatarHandlers } from './handlers/avatars'
import { knowledgeHandlers } from './handlers/knowledge'

export const handlers = [
  ...authHandlers,
  ...organizationHandlers,
  ...departmentHandlers,
  ...userHandlers,
  ...avatarHandlers,
  ...knowledgeHandlers,
]
