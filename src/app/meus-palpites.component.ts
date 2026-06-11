import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RodadasService, Rodada, Jogo } from './rodadas.service';
import { ResultadosService, Resultado } from './resultados.service';
import { PalpitesService } from './palpites.service';

interface PalpiteComResultado {
  jogo: Jogo;
  palpiteA: number;
  palpiteB: number;
  placarA?: string;
  placarB?: string;
  acertou: boolean;
}

@Component({
  selector: 'app-meus-palpites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page page-meus-palpites">
      <header>
        <h1>🎯 Meus Palpites</h1>
        <p>Acompanhe seus palpites e acertos ao longo da Copa.</p>
      </header>

      <div *ngIf="todasPalpites().length === 0" class="intro-block">
        <p>🤔 Você ainda não fez nenhum palpite. Vá para <strong>Rodadas</strong> e comece a participar!</p>
      </div>

      <div *ngIf="todasPalpites().length > 0" class="resumo-stats">
        <div class="stat-card">
          <span class="stat-valor">{{ totalPalpites() }}</span>
          <span class="stat-label">Total de Palpites</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">{{ pontosTotais }}</span>
          <span class="stat-label">Pontos</span>
        </div>
        <div class="stat-card acertos">
          <span class="stat-valor">{{ exatosTotais }}</span>
          <span class="stat-label">Acertos Exatos</span>
        </div>
      </div>

      <div *ngFor="let rodada of rodasComPalpites()" class="rodada-palpites">
        <div class="rodada-header">
          <h2>📅 {{ rodada.dataFormatada }} ({{ rodada.diaSemana }})</h2>
          <span class="rodada-numero">🎯 Rodada {{ rodada.numero }}</span>
        </div>

        <div class="palpites-lista">
          <div *ngFor="let palpite of getPalpitesRodada(rodada)" class="palpite-item">
            <div class="times-info">
              <span class="time">{{ palpite.jogo.time1 }}</span>
              <span class="horario">{{ palpite.jogo.horario }}</span>
              <span class="time">{{ palpite.jogo.time2 }}</span>
            </div>

            <div class="palpite-resultado">
              <div class="meu-palpite">
                <span class="placar">{{ palpite.palpiteA }} x {{ palpite.palpiteB }}</span>
                <span class="label">Meu Palpite</span>
              </div>

              <div *ngIf="palpite.placarA !== undefined" [class.acertou]="palpite.acertou" class="resultado-real">
                <span class="placar">{{ palpite.placarA }} x {{ palpite.placarB }}</span>
                <span class="label">Resultado</span>
              </div>

              <div *ngIf="palpite.placarA === undefined" class="resultado-real pendente">
                <span class="placar">? x ?</span>
                <span class="label">Pendente</span>
              </div>
            </div>

            <div [class.acertou]="palpite.acertou" class="status-badge">
              <span *ngIf="palpite.placarA === undefined">⏳</span>
              <span *ngIf="palpite.placarA !== undefined && palpite.acertou">✅</span>
              <span *ngIf="palpite.placarA !== undefined && !palpite.acertou">❌</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .resumo-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .stat-card {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 0.8rem;
      background: rgba(1, 150, 69, 0.08);
      border: 1px solid rgba(1, 150, 69, 0.2);
      text-align: center;
    }

    .stat-card.acertos {
      background: rgba(255, 234, 61, 0.15);
      border-color: rgba(255, 234, 61, 0.3);
    }

    .stat-valor {
      font-size: 1.8rem;
      font-weight: 900;
      color: #009c45;
    }

    .stat-card.acertos .stat-valor {
      color: #ffea3d;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #10233f;
      letter-spacing: 0.03em;
    }

    .rodada-palpites {
      margin: 2rem 0;
      padding: 1.5rem;
      border-radius: 1.2rem;
      background: rgba(248, 255, 241, 0.5);
      border: 1px solid rgba(1, 77, 30, 0.15);
    }

    .rodada-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(1, 150, 69, 0.2);
    }

    .rodada-header h2 {
      margin: 0;
      font-size: 1.1rem;
      color: #012169;
    }

    .rodada-numero {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      background: #009c45;
      color: white;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .palpites-lista {
      display: grid;
      gap: 0.8rem;
    }

    .palpite-item {
      display: grid;
      grid-template-columns: 1fr 1.8fr auto;
      gap: 1rem;
      align-items: center;
      padding: 0.9rem;
      border-radius: 0.6rem;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(1, 77, 30, 0.12);
    }

    .times-info {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0.5rem;
      align-items: center;
      text-align: center;
    }

    .time {
      font-weight: 600;
      font-size: 0.85rem;
      color: #10233f;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .horario {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: #ffea3d;
      color: #012169;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.7rem;
    }

    .palpite-resultado {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0.75rem;
      align-items: center;
    }

    .meu-palpite,
    .resultado-real {
      display: grid;
      gap: 0.3rem;
      text-align: center;
    }

    .placar {
      display: block;
      font-size: 1.1rem;
      font-weight: 900;
      color: #012169;
    }

    .label {
      display: block;
      font-size: 0.65rem;
      font-weight: 700;
      color: #37526d;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .resultado-real {
      padding: 0.5rem;
      border-radius: 0.5rem;
      background: rgba(1, 150, 69, 0.1);
      border: 1px solid rgba(1, 150, 69, 0.2);
    }

    .resultado-real.pendente {
      background: rgba(100, 100, 100, 0.08);
      border-color: rgba(100, 100, 100, 0.2);
    }

    .resultado-real.acertou {
      background: rgba(0, 156, 69, 0.2);
      border-color: #009c45;
    }

    .status-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(1, 77, 30, 0.1);
      font-size: 1.3rem;
    }

    .status-badge.acertou {
      background: rgba(0, 156, 69, 0.2);
    }

    @media (max-width: 760px) {
      .resumo-stats {
        grid-template-columns: 1fr;
      }

      .palpite-item {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .times-info {
        grid-template-columns: 1fr auto 1fr;
      }

      .palpite-resultado {
        grid-template-columns: 1fr;
      }

      .rodada-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .rodada-header h2 {
        font-size: 0.95rem;
      }
    }
  `]
})
export class MeusPalpitesComponent implements OnInit {
  private rodadasService = inject(RodadasService);
  private resultadosService = inject(ResultadosService);
  private palpitesService = inject(PalpitesService);

  private palpites: { [key: string]: number } = {};
  private palpitesMap: Map<string, PalpiteComResultado> = new Map();
  protected pontosTotais = 0;
  protected acertosTotais = 0;
  protected exatosTotais = 0;

  ngOnInit(): void {
    effect(() => {
      this.carregarPalpites();
      this.processarPalpitesComResultados();
      this.atualizarEstatisticas();
    });
  }

  private carregarPalpites(): void {
    this.palpites = this.palpitesService.getPalpitesUsuarioAtual();
  }

  private processarPalpitesComResultados(): void {
    const resultados = this.resultadosService.resultados();
    const resultadosPorId = new Map(
      resultados
        .filter((r): r is Resultado & { jogoId: string } => !!r.jogoId)
        .map(r => [r.jogoId, { placarA: r.placarA, placarB: r.placarB }])
    );
    const resultadosPorPartida = new Map(
      resultados.map(r => [r.partida.toLowerCase(), { placarA: r.placarA, placarB: r.placarB }])
    );

    this.rodadasService.getRodadas().forEach(rodada => {
      rodada.jogos.forEach(jogo => {
        const palpiteKeyA = jogo.id;
        const palpiteKeyB = jogo.id + '-b';

        if (palpiteKeyA in this.palpites && palpiteKeyB in this.palpites) {
          const palpiteA = this.palpites[palpiteKeyA];
          const palpiteB = this.palpites[palpiteKeyB];

          const resultado = resultadosPorId.get(jogo.id)
            ?? resultadosPorPartida.get(`${jogo.time1.toLowerCase()} x ${jogo.time2.toLowerCase()}`);

          const acertou = resultado
            ? parseInt(resultado.placarA, 10) === palpiteA && parseInt(resultado.placarB, 10) === palpiteB
            : false;

          this.palpitesMap.set(jogo.id, {
            jogo,
            palpiteA,
            palpiteB,
            placarA: resultado?.placarA,
            placarB: resultado?.placarB,
            acertou
          });
        }
      });
    });
  }

  private atualizarEstatisticas(): void {
    const ranking = this.palpitesService.getClassificacao(this.resultadosService.resultados());
    const participante = this.palpitesService.getParticipanteAtual();
    const meuRanking = participante ? ranking.find(item => item.email === participante.email) : null;

    this.pontosTotais = meuRanking?.pontos ?? 0;
    this.acertosTotais = meuRanking?.acertos ?? 0;
    this.exatosTotais = meuRanking?.exatos ?? 0;
  }

  rodasComPalpites(): Rodada[] {
    const rodasUniqueDates = new Map<string, Rodada>();
    this.palpitesMap.forEach(palpite => {
      const rodada = this.rodadasService
        .getRodadas()
        .find(r => r.jogos.some(j => j.id === palpite.jogo.id));
      if (rodada) {
        rodasUniqueDates.set(rodada.id, rodada);
      }
    });
    return Array.from(rodasUniqueDates.values()).sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
  }

  getPalpitesRodada(rodada: Rodada): PalpiteComResultado[] {
    return rodada.jogos
      .map(jogo => this.palpitesMap.get(jogo.id))
      .filter((p): p is PalpiteComResultado => p !== undefined);
  }

  todasPalpites(): PalpiteComResultado[] {
    return Array.from(this.palpitesMap.values());
  }

  totalPalpites(): number {
    return this.palpitesMap.size;
  }

  acertos(): number {
    return Array.from(this.palpitesMap.values()).filter(p => p.acertou).length;
  }

  percentualAcerto(): number {
    const total = this.totalPalpites();
    if (total === 0) return 0;
    return Math.round((this.acertos() / total) * 100);
  }
}
