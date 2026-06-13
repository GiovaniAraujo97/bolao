import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda a restauração inicial da sessão antes de avaliar o guard.
  await (auth as AuthService).ready;

  return auth.isAuthenticated()
    ? auth.isAdmin()
      ? true
      : router.createUrlTree(['/dashboard'])
    : router.createUrlTree(['/login']);
};
