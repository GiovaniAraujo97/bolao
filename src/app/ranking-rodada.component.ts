import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RodadasService, Rodada } from './rodadas.service';
import { PalpitesService } from './palpites.service';
import { ResultadosService } from './resultados.service';

@Component({
  selector: 'app-ranking-rodada',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page page-ranking-rodada">
      <header class="page-header-card">
        <div class="page-title">
          <p class="eyebrow">Ranking da Rodada</p>
          <h1>🏆 Performance por rodada</h1>
          <p>Veja o resultado dos participantes, destaque os acertos exatos e acompanhe a rodada atual.</p>
        </div>
        <div class="page-actions">
          <span class="select-label">Selecionar rodada</span>
          <div class="select-wrapper">
            <select class="select-rodada" (change)="selectRodada($any($event.target).value)">
              <option *ngFor="let r of rodadas()" [value]="r.numero">Rodada {{ r.numero }} — {{ formatDateBR(r.data) }}</option>
            </select>
          </div>
        </div>
      </header>

      <div class="ranking-list">
        <div *ngFor="let p of ranking()" class="ranking-row">
          <span class="pos">{{ p.pos }}</span>
          <span class="nome">{{ p.nome }}</span>
          <span class="pontos">{{ p.pontos }} pts</span>
          <span class="status" [class.acertou]="p.status === 'ACERTOU'" [class.perdeu]="p.status === 'PERDEU'">{{ p.status }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page {
      padding: 0 1rem;
    }

    .page-header-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2rem;
      padding: 1.8rem 1.8rem 1.5rem;
      border-radius: 1rem;
      background: linear-gradient(180deg, #ffffff 0%, #eef7ef 100%);
      border: 1px solid rgba(1,150,69,0.18);
      box-shadow: 0 18px 30px rgba(0,0,0,0.08);
      margin-bottom: 1.8rem;
      flex-wrap: wrap;
    }

    .page-title {
      max-width: 62%;
      flex: 1;
      min-width: 250px;
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0b6623;
    }

    .page-title h1 {
      margin: 0 0 0.7rem;
      font-size: 2rem;
      color: #0f172a;
      line-height: 1.1;
    }

    .page-title p {
      margin: 0;
      color: #475569;
      line-height: 1.8;
      font-size: 1rem;
      max-width: 38rem;
    }

    .page-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      min-width: 280px;
    }

    .select-label {
      font-weight: 700;
      color: #10233f;
      display: block;
      font-size: 0.95rem;
    }

    .select-wrapper {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    .select-rodada {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 100%;
      padding: 0.95rem 2.4rem 0.95rem 1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(1,150,69,0.22);
      background: linear-gradient(180deg, #ffffff, #eff9ef);
      font-weight: 700;
      color: #0f172a;
      cursor: pointer;
      box-shadow: 0 10px 22px rgba(0,0,0,0.08);
      font-size: 0.95rem;
    }

    .select-wrapper::after {
      content: '▾';
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #012169;
      font-size: 1rem;
    }

    .ranking-list {
      border-radius: 1rem;
      overflow: hidden;
    }

    .ranking-row {
      display: grid;
      grid-template-columns: 40px 1fr 130px 120px;
      gap: 1rem;
      padding: 0.8rem;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      align-items: center;
      background: #fff;
    }

    .pos {
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #0b6623, #087a3a);
      color: #fff;
      border-radius: 50%;
      font-size: 0.9rem;
    }

    .nome {
      font-weight: 700;
      color: #0f172a;
      word-break: break-word;
    }

    .pontos {
      font-weight: 700;
      color: #0b6623;
      text-align: right;
      font-size: 1rem;
    }

    .status {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      text-align: right;
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
    }

    .status.acertou {
      color: #0b6623;
      background: rgba(11, 102, 35, 0.1);
    }

    .status.perdeu {
      color: #c70000;
      background: rgba(199, 0, 0, 0.1);
    }

    /* Tablets */
    @media (max-width: 768px) {
      .page {
        padding: 0 0.75rem;
      }

      .page-header-card {
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem 1.2rem;
      }

      .page-title {
        max-width: 100%;
        min-width: auto;
      }

      .page-title h1 {
        font-size: 1.75rem;
      }

      .page-title p {
        font-size: 0.95rem;
      }

      .page-actions {
        width: 100%;
        align-items: stretch;
        min-width: auto;
      }

      .select-wrapper {
        width: 100%;
      }

      .ranking-row {
        grid-template-columns: 35px 1fr 100px 100px;
        gap: 0.8rem;
        padding: 0.7rem;
        font-size: 0.95rem;
      }

      .pos {
        width: 35px;
        height: 35px;
        font-size: 0.8rem;
      }

      .pontos {
        font-size: 0.95rem;
      }

      .status {
        font-size: 0.75rem;
        padding: 0.3rem 0.6rem;
      }
    }

    /* Mobile */
    @media (max-width: 480px) {
      .page {
        padding: 0 0.5rem;
      }

      .page-header-card {
        padding: 1.2rem 1rem;
        border-radius: 0.75rem;
        margin-bottom: 1.2rem;
      }

      .eyebrow {
        font-size: 0.75rem;
      }

      .page-title h1 {
        font-size: 1.4rem;
        margin-bottom: 0.5rem;
      }

      .page-title p {
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .select-label {
        font-size: 0.85rem;
      }

      .select-rodada {
        padding: 0.8rem 2rem 0.8rem 0.8rem;
        border-radius: 0.75rem;
        font-size: 0.9rem;
      }

      .ranking-list {
        border-radius: 0.75rem;
      }

      .ranking-row {
        grid-template-columns: 32px 1fr 80px;
        gap: 0.6rem;
        padding: 0.6rem;
        font-size: 0.9rem;
      }

      .pos {
        width: 32px;
        height: 32px;
        font-size: 0.75rem;
      }

      .nome {
        font-size: 0.95rem;
        min-width: 0;
      }

      .pontos {
        display: none;
      }

      .status {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        white-space: nowrap;
      }

      .ranking-row .status {
        grid-column: 3;
      }
    }

    /* Extra small phones */
    @media (max-width: 360px) {
      .page-title h1 {
        font-size: 1.25rem;
      }

      .ranking-row {
        grid-template-columns: 30px 1fr;
        gap: 0.5rem;
      }

      .pos {
        width: 30px;
        height: 30px;
        font-size: 0.7rem;
      }

      .status {
        grid-column: 1 / -1;
        margin-top: 0.3rem;
        text-align: left;
      }
    }
  `]
})
export class RankingRodadaComponent {
  private readonly rodadasService = inject(RodadasService);
  private readonly palpitesService = inject(PalpitesService);
  private readonly resultadosService = inject(ResultadosService);

  protected readonly rodadas = signal<Rodada[]>(this.rodadasService.getRodadasDoBrasil());
  protected readonly selectedRodada = signal<number>(this.rodadas()[0]?.numero ?? 0);

  protected selectRodada(value: string | number): void {
    this.selectedRodada.set(Number(value));
  }

  protected ranking() {
    const rodadaNum = this.selectedRodada();
    const rodada = this.rodadas().find(r => r.numero === rodadaNum);
    if (!rodada) return [];

    const resultados = this.resultadosService.resultados();
    const resultadosPorId = new Map(
      resultados
        .filter((r): r is (typeof r & { jogoId: string }) => !!r.jogoId)
        .map(r => [r.jogoId, r])
    );

    const participantes = this.palpitesService.getParticipantes();

    const rows = participantes.map(p => {
      let pontos = 0;

      rodada.jogos.forEach(jogo => {
        const aKey = jogo.id;
        const bKey = jogo.id + '-b';
        const palA = p.palpites[aKey];
        const palB = p.palpites[bKey];
        if (palA === undefined || palB === undefined) return;

        const res = resultadosPorId.get(jogo.id);
        if (!res) return;

        const placarA = parseInt(res.placarA, 10);
        const placarB = parseInt(res.placarB, 10);
        const acertouExato = palA === placarA && palB === placarB;

        if (acertouExato) { pontos += 10; }
      });

      return { nome: p.nome, pontos };
    });

    return rows
      .map((r, i) => ({ pos: i + 1, ...r, status: r.pontos > 0 ? 'ACERTOU' : 'PERDEU' }))
      .sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
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
