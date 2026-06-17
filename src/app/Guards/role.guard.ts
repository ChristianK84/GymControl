import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { SessionService } from '../Services/session.service';

export const roleGuard: CanActivateChildFn = (childRoute) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const requiredRoles: number[] = childRoute.data?.['roles'] ?? [];
  const user = session.getUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (requiredRoles.length === 0) {
    return router.createUrlTree(['/dashboard/alumnos']);
  }

  if (requiredRoles.includes(user.role_id)) {
    return true;
  }

  return router.createUrlTree(['/dashboard/alumnos']);
};
