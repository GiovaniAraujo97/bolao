import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page page-login">
      <div class="login-panel">
        <header>
          <h1>{{ mode === 'login' ? 'Login' : 'Criar conta' }}</h1>
          <p *ngIf="mode === 'login'">Acompanhar o bolão da Adega.</p>
          <p *ngIf="mode === 'signup'">Informe e-mail, senha e telefone para criar sua conta.</p>
        </header>

        <form class="form-card" autocomplete="off" (submit)="mode === 'login' ? onLogin(emailInput.value, senhaInput.value) : onSignup(emailInput.value, senhaInput.value, telefone); $event.preventDefault();">
          <input aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;border:0;margin:0;padding:0;" autocomplete="username" />
          <input aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;border:0;margin:0;padding:0;" autocomplete="current-password" />

          <label>
            E-mail
            <input type="email" name="visible-email" autocomplete="off" #emailInput placeholder="seu@email.com" required />
          </label>

          <label>
            Senha
            <input type="password" name="visible-password" autocomplete="new-password" #senhaInput placeholder="••••••••" required />
          </label>

          <label *ngIf="mode === 'signup'">
            Telefone
            <input
              type="tel"
              name="telefone"
              autocomplete="tel"
              placeholder="(00) 00000-0000"
              [value]="telefone"
              (input)="telefone = $any($event.target).value"
              required
            />
          </label>

          <div class="login-actions">
            <button type="submit" [disabled]="auth.loading()">{{ mode === 'login' ? 'Entrar' : 'Cadastrar' }}</button>
            <button type="button" class="secondary" (click)="mode === 'login' ? switchToSignup() : switchToLogin()" [disabled]="auth.loading()">
              {{ mode === 'login' ? 'Criar conta' : 'Voltar para login' }}
            </button>
          </div>
        </form>
      </div>

      <div class="message-modal" *ngIf="auth.message()" aria-live="polite">
        <button type="button" class="close-modal" (click)="closeMessage()" aria-label="Fechar mensagem">×</button>
        <p>{{ auth.message() }}</p>
      </div>

      <footer class="footnote">
        <p *ngIf="mode === 'login'">Se você ainda não tem conta, use "Criar conta".</p>
        <p *ngIf="mode === 'signup'">Já tem conta? Volte para o login.</p>
        <a routerLink="/dashboard">Ir para o painel</a>
      </footer>
    </section>
  `
})
export class LoginComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected mode: 'login' | 'signup' = 'login';
  protected telefone = '';

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate([this.auth.isAdmin() ? '/admin' : '/dashboard']);
      return;
    }
  }

  protected switchToSignup(): void {
    this.mode = 'signup';
    this.auth.message.set('');
  }

  protected switchToLogin(): void {
    this.mode = 'login';
    this.telefone = '';
    this.auth.message.set('');
  }

  protected closeMessage(): void {
    this.auth.message.set('');
  }

  protected async onLogin(email: string, senha: string): Promise<void> {
    if (!(await this.auth.login(email, senha))) {
      return;
    }

    const dest = this.auth.isAdmin() ? '/admin' : '/dashboard';
    try {
      await this.router.navigate([dest]);
    } catch (e) {
      // ignore
    }

    // fallback: força reload completo se a rota ainda estiver em /login
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        window.location.replace(dest);
      }
    }, 200);
  }

  protected async onSignup(email: string, senha: string, telefone: string): Promise<void> {
    if (!(await this.auth.signup(email, senha, telefone))) {
      return;
    }

    if (this.auth.isAuthenticated()) {
      const dest = this.auth.isAdmin() ? '/admin' : '/dashboard';
      try {
        await this.router.navigate([dest]);
      } catch (e) {}

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          window.location.replace(dest);
        }
      }, 200);
      return;
    }

    this.mode = 'login';
  }
}
