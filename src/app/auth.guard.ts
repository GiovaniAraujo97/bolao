import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda a restauração inicial da sessão, mas não indefinidamente (timeout de 2s)
  const readyPromise = (auth as AuthService).ready;
  await Promise.race([
    readyPromise,
    new Promise<void>((res) => setTimeout(res, 2000))
  ]);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
