import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RodadasService, Rodada, Jogo } from './rodadas.service';
import { ResultadosService } from './resultados.service';

interface JogoComResultado extends Jogo {
  placarA?: string;
  placarB?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-admin">
      <header>
        <h1>⚙️ Painel do Administrador</h1>
        <p>Use esta área apenas para lançar os resultados oficiais. O bolão dos participantes será atualizado automaticamente com base nos palpites.</p>
      </header>

      <div class="admin-stats">
        <div class="stat-card">
          <span class="stat-valor">{{ totalPartidas }}</span>
          <span class="stat-label">Total de Partidas</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">{{ resultadosService.resultados().length }}</span>
          <span class="stat-label">Placares Lançados</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">{{ percentualLancado() }}%</span>
          <span class="stat-label">Progresso</span>
        </div>
      </div>

      <div class="rodadas-admin">
        <div *ngFor="let rodada of rodadasService.getRodadas(); trackBy: trackByRodada" class="rodada-bloco">
          <div class="rodada-titulo">
            <h2>📅 {{ rodada.dataFormatada }} ({{ rodada.diaSemana }})</h2>
            <span class="rodada-num">Rodada {{ rodada.numero }}</span>
          </div>

          <div class="partidas-grid">
            <div *ngFor="let jogo of getJogosComResultados(rodada); trackBy: trackByJogo" class="partida-card">
              <div class="partida-times">
                <span class="time-a">{{ jogo.time1 }}</span>
                <span class="vs-text">vs</span>
                <span class="time-b">{{ jogo.time2 }}</span>
              </div>

              <div class="partida-info">
                <span class="horario">{{ jogo.horario }}</span>
              </div>

              <div *ngIf="!temResultado(jogo.id)" class="partida-inputs">
                <input 
                  type="number" 
                  [(ngModel)]="placares[jogo.id + '-a']"
                  placeholder="0"
                  min="0"
                  class="input-placar"
                />
                <span class="divisor">x</span>
                <input 
                  type="number" 
                  [(ngModel)]="placares[jogo.id + '-b']"
                  placeholder="0"
                  min="0"
                  class="input-placar"
                />
                <button (click)="salvarPlacar(jogo)" class="btn-save">Salvar</button>
              </div>

              <div *ngIf="temResultado(jogo.id)" class="partida-resultado-salvo">
                <span class="placar-final">{{ jogo.placarA }} x {{ jogo.placarB }}</span>
                <span class="badge-salvo">✅ Salvo</span>
                <button (click)="editarPlacar(jogo)" class="btn-edit">Editar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .admin-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0 2rem 0;
    }

    .stat-card {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 0.8rem;
      background: rgba(1, 150, 69, 0.1);
      border: 1px solid rgba(1, 150, 69, 0.2);
      text-align: center;
    }

    .stat-valor {
      display: block;
      font-size: 1.8rem;
      font-weight: 900;
      color: #009c45;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #37526d;
      letter-spacing: 0.03em;
    }

    .rodadas-admin {
      display: grid;
      gap: 2rem;
      margin-top: 2rem;
    }

    .rodada-bloco {
      border: 1px solid rgba(1, 77, 30, 0.2);
      border-radius: 1.2rem;
      padding: 1.5rem;
      background: rgba(248, 255, 241, 0.5);
    }

    .rodada-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(1, 150, 69, 0.2);
    }

    .rodada-titulo h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #012169;
    }

    .rodada-num {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      background: #009c45;
      color: white;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .partidas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .partida-card {
      display: grid;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(1, 150, 69, 0.15);
      transition: all 0.3s ease;
    }

    .partida-card:hover {
      box-shadow: 0 4px 12px rgba(1, 77, 30, 0.1);
    }

    .partida-times {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0.5rem;
      align-items: center;
      text-align: center;
    }

    .time-a, .time-b {
      font-weight: 700;
      font-size: 0.85rem;
      color: #10233f;
    }

    .vs-text {
      font-size: 0.7rem;
      color: #37526d;
      font-weight: 600;
    }

    .partida-info {
      display: flex;
      justify-content: center;
    }

    .horario {
      display: inline-block;
      padding: 0.3rem 0.7rem;
      background: #ffea3d;
      color: #012169;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .partida-inputs {
      display: grid;
      grid-template-columns: 60px auto 60px 1fr;
      gap: 0.5rem;
      align-items: center;
    }

    .input-placar {
      padding: 0.6rem;
      border: 1px solid #009c45;
      border-radius: 0.5rem;
      text-align: center;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .input-placar:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(1, 150, 69, 0.2);
    }

    .divisor {
      text-align: center;
      font-weight: 700;
      color: #009c45;
    }

    .btn-save {
      padding: 0.5rem 0.8rem;
      border: none;
      border-radius: 0.5rem;
      background: #012169;
      color: white;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-save:hover {
      background: #08337b;
      transform: translateY(-1px);
    }

    .partida-resultado-salvo {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.6rem;
      background: rgba(0, 156, 69, 0.1);
      border: 1px solid rgba(0, 156, 69, 0.3);
    }

    .placar-final {
      font-size: 1.2rem;
      font-weight: 900;
      color: #009c45;
    }

    .badge-salvo {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .btn-edit {
      padding: 0.4rem 0.6rem;
      border: 1px solid #009c45;
      border-radius: 0.4rem;
      background: transparent;
      color: #009c45;
      font-weight: 700;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-edit:hover {
      background: #009c45;
      color: white;
    }

    @media (max-width: 760px) {
      .admin-stats {
        grid-template-columns: repeat(3, 1fr);
      }

      .partidas-grid {
        grid-template-columns: 1fr;
      }

      .rodada-titulo {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .rodada-titulo h2 {
        font-size: 1rem;
      }

      .partida-inputs {
        grid-template-columns: 50px auto 50px;
      }

      .input-placar {
        padding: 0.5rem;
        font-size: 0.85rem;
      }

      .btn-save {
        grid-column: 1 / -1;
        padding: 0.6rem;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  protected readonly rodadasService = inject(RodadasService);
  protected readonly resultadosService = inject(ResultadosService);

  totalPartidas = 0;
  placares: { [key: string]: string } = {};
  protected feedback = signal('');

  // Cache de resultados para evitar loops pesados de Change Detection
  private readonly resultadosCache = computed(() => {
    const resultados = this.resultadosService.resultados();
    const mapa = new Map<string, { a: string; b: string }>();
    resultados.forEach(r => {
      mapa.set(r.jogoId || '', { a: r.placarA, b: r.placarB });
    });
    return mapa;
  });

  ngOnInit(): void {
    this.calcularTotal();
  }

  private calcularTotal(): void {
    this.totalPartidas = this.rodadasService
      .getRodadas()
      .reduce((acc, r) => acc + r.jogos.length, 0);
  }

  getJogosComResultados(rodada: Rodada): JogoComResultado[] {
    const cache = this.resultadosCache();
    return rodada.jogos.map(jogo => {
      const resultado = cache.get(jogo.id);
      return {
        ...jogo,
        placarA: resultado?.a,
        placarB: resultado?.b
      };
    });
  }

  private obterPlacar(jogoId: string, tipo: 'a' | 'b'): string | undefined {
    const cache = this.resultadosCache();
    const resultado = cache.get(jogoId);
    return tipo === 'a' ? resultado?.a : resultado?.b;
  }

  temResultado(jogoId: string): boolean {
    return this.resultadosCache().has(jogoId) && this.obterPlacar(jogoId, 'a') !== undefined;
  }

  salvarPlacar(jogo: Jogo): void {
    const placarA = this.placares[jogo.id + '-a'] || '0';
    const placarB = this.placares[jogo.id + '-b'] || '0';

    const partida = `${jogo.time1} x ${jogo.time2}`;
    this.resultadosService.addResultado(partida, placarA, placarB, jogo.id);

    delete this.placares[jogo.id + '-a'];
    delete this.placares[jogo.id + '-b'];
    this.feedback.set(`✅ Placar de ${partida} salvo!`);
    setTimeout(() => this.feedback.set(''), 3000);
  }

  editarPlacar(jogo: Jogo): void {
    const placarA = this.obterPlacar(jogo.id, 'a');
    const placarB = this.obterPlacar(jogo.id, 'b');

    this.placares[jogo.id + '-a'] = placarA || '0';
    this.placares[jogo.id + '-b'] = placarB || '0';
  }

  percentualLancado(): number {
    if (this.totalPartidas === 0) return 0;
    return Math.round((this.resultadosService.resultados().length / this.totalPartidas) * 100);
  }

  protected trackByRodada(_index: number, rodada: Rodada): string {
    return rodada.id;
  }

  protected trackByJogo(_index: number, jogo: Jogo): string {
    return jogo.id;
  }
}
