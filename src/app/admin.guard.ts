import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda a restauração inicial da sessão com timeout para evitar bloqueio
  const readyPromise = (auth as AuthService).ready;
  await Promise.race([
    readyPromise,
    new Promise<void>((res) => setTimeout(res, 2000))
  ]);

  return auth.isAuthenticated()
    ? auth.isAdmin()
      ? true
      : router.createUrlTree(['/dashboard'])
    : router.createUrlTree(['/login']);
};
