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
      <header>
        <h1>🏆 Copa - Bolão da Adega</h1>
        <p>Bem-vindo! Acompanhe todas as rodadas, faça seus palpites e compete com os amigos.</p>
      </header>

      <div class="hero-banner">
        <h2>⚽ Faça seus palpites no bolão da Copa 2026.</h2>
        <p>Escolha cada dia, coloque seus palpites em todos os jogos e veja sua taxa de acerto. Quanto mais acertos, melhor sua posição no ranking!</p>
      </div>

      <div class="stats-container">
        <div class="stat-box">
          <span class="stat-icone">🎯</span>
          <span class="stat-numero">{{ totalRodadas }}</span>
          <span class="stat-texto">Dias de Jogo</span>
        </div>
        <div class="stat-box">
          <span class="stat-icone">⚽</span>
          <span class="stat-numero">{{ totalJogos }}</span>
          <span class="stat-texto">Partidas no Total</span>
        </div>
        <div class="stat-box">
          <span class="stat-icone">🇧🇷</span>
          <span class="stat-numero">{{ totalJogosBrasil }}</span>
          <span class="stat-texto">Jogos do Brasil</span>
        </div>
        <div class="stat-box">
          <span class="stat-icone">📅</span>
          <span class="stat-numero">3</span>
          <span class="stat-texto">Rodadas</span>
        </div>
      </div>

      <div class="próximos-jogos">
        <h3>📍 Próximos Jogos</h3>
        <div class="mini-cards">
          <div *ngFor="let rodada of proximasRodadas()" class="mini-card">
            <span class="data">{{ rodada.dataFormatada }}</span>
            <span class="dia">{{ rodada.diaSemana }}</span>
            <span class="count">{{ rodada.jogos.length }} jogos</span>
          </div>
        </div>
      </div>

      <div class="link-grid">
        <a class="card card-primary" routerLink="/rodadas">
          <span class="icone">🎯</span>
          <strong>Rodadas</strong>
          <span>Faça palpites nos jogos do dia.</span>
        </a>
        <a class="card card-secondary" routerLink="/meus-palpites">
          <span class="icone">📊</span>
          <strong>Meus Palpites</strong>
          <span>Acompanhe seus acertos e taxa.</span>
        </a>
        <a class="card card-tertiary" routerLink="/resultados">
          <span class="icone">🏆</span>
          <strong>Resultados</strong>
          <span>Veja os resultados oficiais.</span>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
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
      color: #10233f;
      border: 1px solid rgba(1, 77, 30, 0.15);
      background: rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(1, 77, 30, 0.15);
    }

    .card-primary {
      border-color: rgba(1, 150, 69, 0.3);
      background: linear-gradient(135deg, rgba(1, 150, 69, 0.1) 0%, rgba(248, 255, 241, 0.8) 100%);
    }

    .card-secondary {
      border-color: rgba(255, 234, 61, 0.3);
      background: linear-gradient(135deg, rgba(255, 234, 61, 0.12) 0%, rgba(248, 255, 241, 0.8) 100%);
    }

    .card-tertiary {
      border-color: rgba(1, 33, 105, 0.2);
      background: linear-gradient(135deg, rgba(1, 33, 105, 0.08) 0%, rgba(248, 255, 241, 0.8) 100%);
    }

    .card .icone {
      font-size: 1.8rem;
      display: block;
    }

    .card strong {
      font-size: 1.1rem;
      color: #012169;
    }

    .card span:last-child {
      font-size: 0.85rem;
      color: #37526d;
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
}
