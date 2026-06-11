import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page page-not-found">
      <header>
        <h1>Página não encontrada</h1>
        <p>O endereço que você tentou acessar não existe.</p>
      </header>

      <a routerLink="/dashboard">Ir para o painel</a>
    </section>
  `
})
export class NotFoundComponent {}
