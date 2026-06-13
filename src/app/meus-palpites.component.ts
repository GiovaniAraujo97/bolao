import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RodadasService, Jogo } from './rodadas.service';
import { ResultadosService, Resultado } from './resultados.service';
import { PalpitesService } from './palpites.service';

interface PalpiteComResultado {
  jogo: Jogo;
  palpiteA: number;
  palpiteB: number;
  placarA?: string;
  placarB?: string;
  acertou: boolean;
  exato: boolean;
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
        <p>🤔 Você ainda não fez nenhum palpite. Faça seu primeiro palpite para começar a acompanhar!</p>
      </div>

      <div *ngIf="todasPalpites().length > 0" class="resumo-stats">
        <div class="stat-card">
          <span class="stat-valor">{{ totalPalpites() }}</span>
          <span class="stat-label">Total de Palpites</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">{{ getPontosTotais() }}</span>
          <span class="stat-label">Pontos Totais</span>
        </div>        <div class="stat-card">
          <span class="stat-valor">{{ getAcertosTotais() }}</span>
          <span class="stat-label">Acertos Totais</span>
        </div>        <div class="stat-card acertos">
          <span class="stat-valor">{{ getExatosTotais() }}</span>
          <span class="stat-label">Exatos Totais</span>
        </div>
      </div>

      <div class="palpites-lista">
        <div *ngFor="let palpite of todasPalpites()" class="palpite-item">
          <div class="times-info">
                <div class="team-card">
                  <img
                    [src]="teamImageUrl(palpite.jogo.time1)"
                    [alt]="palpite.jogo.time1"
                    class="team-logo"
                    (error)="onTeamImageError($event, palpite.jogo.time1)"
                  />
                  <span class="team-name">{{ palpite.jogo.time1 }}</span>
                </div>
                <span class="horario">{{ formatDateBR(palpite.jogo.data) }} • {{ palpite.jogo.horario }}</span>
                <div class="team-card">
                  <img
                    [src]="teamImageUrl(palpite.jogo.time2)"
                    [alt]="palpite.jogo.time2"
                    class="team-logo"
                    (error)="onTeamImageError($event, palpite.jogo.time2)"
                  />
                  <span class="team-name">{{ palpite.jogo.time2 }}</span>
                </div>
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

          <div [class.acertou]="palpite.acertou" [class.exato]="palpite.exato" class="status-badge">
            <span *ngIf="palpite.placarA === undefined">⏳</span>
            <span *ngIf="palpite.placarA !== undefined && palpite.exato">✅</span>
            <span *ngIf="palpite.placarA !== undefined && !palpite.exato && palpite.acertou">✅</span>
            <span *ngIf="palpite.placarA !== undefined && !palpite.acertou">❌</span>
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

    .team-card {
      display: grid;
      gap: 0.5rem;
      align-items: center;
      justify-items: center;
    }

    .team-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 12px;
      background: white;
      border: 1px solid rgba(1, 77, 30, 0.12);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .team-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #10233f;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
      background: transparent;
      font-size: 1.3rem;
    }

    .status-badge.acertou,
    .status-badge.exato {
      background: transparent;
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

  private palpites = signal<{ [key: string]: number }>({});
  private palpitesMap = signal<PalpiteComResultado[]>([]);
  protected pontosTotais = signal(0);
  protected acertosTotais = signal(0);
  protected exatosTotais = signal(0);

  protected readonly palpiteEffect = effect(() => {
    this.carregarPalpites();
    this.processarPalpitesComResultados();
    this.atualizarEstatisticas();
  });

  ngOnInit(): void {
    // inicialização feita pelo efeito reativo `palpiteEffect`
  }

  private carregarPalpites(): void {
    this.palpites.set(this.palpitesService.getPalpitesUsuarioAtual());
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

    const novosPalpites: PalpiteComResultado[] = [];

    this.rodadasService.getRodadas().forEach(rodada => {
      rodada.jogos.forEach(jogo => {
        const palpiteKeyA = jogo.id;
        const palpiteKeyB = jogo.id + '-b';

        if (palpiteKeyA in this.palpites() && palpiteKeyB in this.palpites()) {
          const palpiteA = this.palpites()[palpiteKeyA];
          const palpiteB = this.palpites()[palpiteKeyB];

          const resultado = resultadosPorId.get(jogo.id)
            ?? resultadosPorPartida.get(`${jogo.time1.toLowerCase()} x ${jogo.time2.toLowerCase()}`);

          const exato = resultado
            ? parseInt(resultado.placarA, 10) === palpiteA && parseInt(resultado.placarB, 10) === palpiteB
            : false;
          const acertou = exato;

          novosPalpites.push({
            jogo,
            palpiteA,
            palpiteB,
            placarA: resultado?.placarA,
            placarB: resultado?.placarB,
            acertou,
            exato
          });
        }
      });
    });

    this.palpitesMap.set(novosPalpites);
  }

  private atualizarEstatisticas(): void {
    const ranking = this.palpitesService.getClassificacao(this.resultadosService.resultados());
    const participante = this.palpitesService.getParticipanteAtual();
    const meuRanking = participante ? ranking.find(item => item.email === participante.email) : null;

    this.pontosTotais.set(meuRanking?.pontos ?? 0);
    this.acertosTotais.set(meuRanking?.acertos ?? 0);
    this.exatosTotais.set(meuRanking?.exatos ?? 0);
  }

  private normalizeTeamName(team: string): string {
    return team
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  teamImageUrl(team: string, ext = 'png'): string {
    if (!team) return '';
    const normalized = this.normalizeTeamName(team);
    return `/${encodeURIComponent(normalized)}.${ext}`;
  }

  onTeamImageError(event: Event, team: string): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    const normalized = this.normalizeTeamName(team);
    if (img.src.endsWith('.png')) {
      img.src = `/${encodeURIComponent(normalized)}.jpg`;
      return;
    }
    if (img.src.endsWith('.jpg')) {
      img.src = `/${encodeURIComponent(normalized)}.jpeg`;
      return;
    }
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

  // getters para template — evita exposição direta do objeto `Signal`
  getPontosTotais(): number {
    return this.pontosTotais();
  }

  getExatosTotais(): number {
    return this.exatosTotais();
  }

  getAcertosTotais(): number {
    return this.acertosTotais();
  }

  todasPalpites(): PalpiteComResultado[] {
    return this.palpitesMap();
  }

  totalPalpites(): number {
    return this.palpitesMap().length;
  }

  acertos(): number {
    return this.palpitesMap().filter(p => p.acertou).length;
  }

  percentualAcerto(): number {
    const total = this.totalPalpites();
    if (total === 0) return 0;
    return Math.round((this.acertos() / total) * 100);
  }
}
