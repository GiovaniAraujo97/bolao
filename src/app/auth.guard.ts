import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda a restauração inicial da sessão antes de avaliar o guard.
  await (auth as AuthService).ready;

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
