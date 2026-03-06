import type { App, DirectiveBinding } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { hasAnyRole } from '@/utils/permission';
import type { UserRole } from '@/types/auth';

const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const authStore = useAuthStore();
    const user = authStore.user;

    if (value && value instanceof Array && value.length > 0) {
      const requiredRoles = value as UserRole[];
      const hasPermission = hasAnyRole(user, requiredRoles);

      if (!hasPermission) {
        if (el.parentNode) {
      el.parentNode.removeChild(el)
    };
      }
    } else {
      throw new Error(`need roles! Like v-permission="['sysadmin','org_admin']"`);
    }
  },
};

export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective);
}
