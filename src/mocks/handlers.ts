import { authHandlers } from './handlers/auth'
import { organizationHandlers } from './handlers/organizations'
import { departmentHandlers } from './handlers/departments'
import { userHandlers } from './handlers/users'
import { avatarHandlers } from './handlers/avatars'
import { avatarConfigHandlers } from './handlers/avatarConfig'
import { knowledgeHandlers } from './handlers/knowledge'
import { knowledgeSearchHandlers } from './handlers/knowledgeSearch'
import { handlers as sessionHandlers } from './handlers/sessions'
import { apiTokenHandlers } from './handlers/apiTokens'

export const handlers = [
  ...authHandlers,
  ...organizationHandlers,
  ...departmentHandlers,
  ...userHandlers,
  ...avatarHandlers,
  ...avatarConfigHandlers,
  ...knowledgeHandlers,
  ...knowledgeSearchHandlers,
  ...sessionHandlers,
  ...apiTokenHandlers,
]
