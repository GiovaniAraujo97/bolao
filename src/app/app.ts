import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  encapsulation: ViewEncapsulation.None
})
export class App {
  protected readonly title = signal('bolao-copa-adega');
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    // Após a restauração inicial da sessão, se estivermos na rota de login
    // mas já houver sessão, navega automaticamente para o destino correto.
    (this.auth as AuthService).ready.then(() => {
      try {
        if (this.router.url === '/login' && this.auth.isAuthenticated()) {
          this.router.navigate([this.auth.isAdmin() ? '/admin' : '/dashboard']);
        }
      } catch (e) {
        // ignora erros de navegação em ambientes de teste
      }
    });
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  protected get isLoginRoute(): boolean {
    return this.router.url === '/login';
  }
}
