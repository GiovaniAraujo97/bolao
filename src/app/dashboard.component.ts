import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RodadasService } from './rodadas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page page-dashboard">
      <header class="dashboard-hero">
        <div class="hero-content">
          <h1 class="hero-title"><img src="/taca.png" alt="troféu" class="hero-icon" /> Copa - Bolão da Adega</h1>
          <p class="hero-lead">Bem-vindo! Acompanhe todas as rodadas, faça seus palpites e compita com os amigos.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" routerLink="/rodadas">Ver Rodadas</a>
            <a class="btn btn-outline" routerLink="/meus-palpites">Meus Palpites</a>
          </div>
        </div>
      </header>

      <div class="próximos-jogos">
        <h3>📍 Próximos Jogos</h3>
        <div class="mini-cards">
          <div *ngFor="let rodada of proximasRodadas()" class="mini-card">
            <span class="data">{{ formatDateBR(rodada.data) }}</span>
            <span class="dia">{{ rodada.diaSemana }}</span>
            <span class="count">{{ rodada.jogos.length }} jogos</span>
          </div>
        </div>
      </div>

      <div class="link-grid">
        <a class="card card-primary" routerLink="/rodadas">
          <img src="/rodadas.png" alt="rodadas" class="card-icon" />
          <strong>Rodadas</strong>
          <span>Faça palpites nos jogos do dia.</span>
        </a>
        <a class="card card-secondary" routerLink="/meus-palpites">
          <img src="/palpite.png" alt="palpites" class="card-icon" />
          <strong>Meus Palpites</strong>
          <span>Acompanhe seus acertos e taxa.</span>
        </a>
        <a class="card card-tertiary" routerLink="/resultados">
          <img src="/taca.png" alt="troféu" class="card-icon" />
          <strong>Resultados</strong>
          <span>Veja os resultados oficiais.</span>
        </a>
      </div>
    </section>
  `,
  styles: [`
    /* Dashboard hero styles */
    .dashboard-hero {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 0 1.5rem;
    }

    .hero-content {
      text-align: center;
      max-width: 820px;
      width: 100%;
      padding: 1.5rem 1.75rem;
    }

    .hero-title {
      margin: 0;
      font-size: clamp(1.5rem, 3.5vw, 2.25rem);
      font-weight: 900;
      color: #ffffff;
      text-transform: none;
      letter-spacing: 0.01em;
      text-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .hero-title .hero-icon {
      width: 34px;
      height: 34px;
      object-fit: contain;
      display: inline-block;
    }

    .hero-lead {
      margin: 0.5rem 0 1rem 0;
      color: rgba(255,255,255,0.95);
      font-size: 1.02rem;
      font-weight: 600;
    }

    .hero-actions {
      display: inline-flex;
      gap: 0.6rem;
      margin-top: 0.25rem;
      align-items: center;
      justify-content: center;
    }

    .btn { text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 999px; font-weight: 800; transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .btn-primary { background: #ffea3d; color: #012169; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12); }
    .btn-outline { background: rgba(255,255,255,0.16); color: #ffffff; border: 1px solid rgba(255,255,255,0.28); }
    .btn:hover { transform: translateY(-1px); }

    @media (max-width: 760px) {
      .hero-content { padding: 1rem; border-radius: 0.9rem; }
      .hero-title { font-size: 1.1rem; }
      .hero-lead { font-size: 0.95rem; }
      .hero-actions { gap: 0.4rem; }
      .btn { padding: 0.6rem 0.8rem; font-size: 0.95rem; }
    }

    .stat-box {
      display: grid;
      gap: 0.5rem;
      align-items: center;
      text-align: center;
      padding: 1.2rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, rgba(1, 150, 69, 0.1) 0%, rgba(255, 234, 61, 0.08) 100%);
      border: 1px solid rgba(1, 150, 69, 0.2);
    }

    .stat-icone {
      font-size: 2rem;
      display: block;
    }

    .stat-icon {
      width: 32px;
      height: 32px;
      display: block;
      margin: 0 auto 0.6rem;
      object-fit: contain;
    }

    .stat-numero {
      display: block;
      font-size: 1.8rem;
      font-weight: 900;
      color: #012169;
    }

    .stat-texto {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #37526d;
      letter-spacing: 0.03em;
    }

    .próximos-jogos {
      margin: 2rem 0;
      padding: 1.5rem;
      border-radius: 1.2rem;
      background: rgba(248, 255, 241, 0.5);
      border: 1px solid rgba(1, 77, 30, 0.15);
    }

    .próximos-jogos h3 {
      margin: 0 0 1rem 0;
      color: #012169;
      font-size: 1.1rem;
    }

    .mini-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 0.8rem;
    }

    .mini-card {
      display: grid;
      gap: 0.3rem;
      padding: 0.8rem;
      border-radius: 0.6rem;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(1, 150, 69, 0.2);
      text-align: center;
    }

    .mini-card .data {
      display: block;
      font-weight: 700;
      color: #009c45;
      font-size: 0.9rem;
    }

    .mini-card .dia {
      display: block;
      font-size: 0.75rem;
      color: #37526d;
    }

    .mini-card .count {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #10233f;
      margin-top: 0.25rem;
    }

    .link-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.2rem;
      margin-top: 2rem;
    }

    .card {
      display: grid;
      gap: 0.75rem;
      align-items: start;
      padding: 1.5rem;
      border-radius: 1rem;
      text-decoration: none;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: url('/fundo-card.png') center/cover no-repeat;
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(1, 77, 30, 0.15);
    }

    .card-primary {
      border-color: rgba(1, 150, 69, 0.3);
    }

    .card-secondary {
      border-color: rgba(255, 234, 61, 0.3);
    }

    .card-tertiary {
      border-color: rgba(1, 33, 105, 0.2);
    }

    .card .icone,
    .card .card-icon {
      font-size: 1.8rem;
      display: block;
    }

    .card-icon {
      width: 40px;
      height: 40px;
      object-fit: contain;
      display: block;
      margin-bottom: 0.75rem;
    }

    .card strong {
      font-size: 1.1rem;
      color: #ffffff;
    }

    .card span:last-child {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.5;
    }

    .hero-banner {
      padding: 1.5rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #009c45 0%, #ffea3d 50%, #012169 100%);
      color: white;
      margin-bottom: 2rem;
    }

    .hero-banner h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.3rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .hero-banner p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.6;
      opacity: 0.95;
    }

    @media (max-width: 760px) {
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
      }

      .link-grid {
        grid-template-columns: 1fr;
      }

      .mini-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .hero-banner h2 {
        font-size: 1.1rem;
      }

      .hero-banner p {
        font-size: 0.8rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private rodadasService = inject(RodadasService);

  totalRodadas = 0;
  totalJogos = 0;
  totalJogosBrasil = 0;

  ngOnInit(): void {
    this.calcularTotais();
  }

  private calcularTotais(): void {
    const rodadasBrasil = this.rodadasService.getRodadasDoBrasil();
    this.totalRodadas = rodadasBrasil.length;
    this.totalJogos = rodadasBrasil.reduce((acc, r) => acc + r.jogos.length, 0);
    this.totalJogosBrasil = this.totalJogos;
  }

  proximasRodadas() {
    const agora = new Date();
    return this.rodadasService
      .getRodadasDoBrasil()
      .filter(r => new Date(r.data) >= agora)
      .slice(0, 4);
  }

  formatDateBR(date?: string): string {
    if (!date) return '';
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return date;
  }
}
