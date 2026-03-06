import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { createPermissionGuard } from './guards';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

createPermissionGuard(router);

export default router;
