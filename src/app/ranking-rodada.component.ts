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
          <p class="eyebrow"><img class="page-icon" src="/taca.png" alt="Taça" />Ranking da Rodada</p>
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
    .page-header-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 320px); gap: 2rem; padding: 2rem 2rem 1.8rem; border-radius: 1.25rem; background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(227,250,235,0.95) 100%); border: 1px solid rgba(1,150,69,0.24); box-shadow: 0 24px 40px rgba(0,0,0,0.12); margin-bottom: 2rem; }
    .page-title { max-width: 100%; }
    .eyebrow { margin: 0 0 0.65rem; font-size: 0.82rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #012169; display: inline-flex; align-items: center; gap: 0.55rem; }
    .page-icon { width: 22px; height: 22px; object-fit: contain; display: inline-block; }
    .page-title h1 { margin: 0 0 0.8rem; font-size: clamp(2rem, 2.5vw, 2.4rem); color: #0b6623; line-height: 1.05; }
    .page-title p { margin: 0; color: #10233f; line-height: 1.85; font-size: 1rem; max-width: none; }

    .page-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; width: 100%; justify-self: end; }
    .select-label { font-weight: 800; color: #10233f; display: block; margin-left: 0.2rem; letter-spacing: 0.03em; }
    .select-wrapper { position: relative; display: inline-block; width: 100%; max-width: 320px; }
    .select-rodada { appearance: none; -webkit-appearance: none; -moz-appearance: none; width: 100%; padding: 1rem 2.4rem 1rem 1rem; border-radius: 1rem; border: 1px solid rgba(1,150,69,0.3); background: linear-gradient(180deg, #ffffff 0%, #ecf9ef 100%); font-weight: 700; color: #0f172a; cursor: pointer; box-shadow: 0 16px 30px rgba(0,0,0,0.12); }
    .select-wrapper::after { content: '▾'; position: absolute; right: 18px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #012169; font-size: 1rem; }

    .ranking-list { background: rgba(255,255,255,0.95); border-radius: 1.1rem; padding: 1rem 1rem 0.6rem; border: 1px solid rgba(1,150,69,0.16); box-shadow: 0 18px 30px rgba(0,0,0,0.07); }
    .ranking-row { display: grid; grid-template-columns: 50px 1fr 120px 110px; gap: 1rem; padding: 1rem 0.4rem; border-bottom: 1px solid rgba(1,34,70,0.08); align-items: center; }
    .ranking-row:last-child { border-bottom: none; }
    .pos { font-weight: 800; color: #10233f; }
    .nome { font-weight: 700; color: #10233f; white-space: normal; overflow: visible; }
    .pontos { font-weight: 800; text-align: right; color: #0b6623; }
    .status { font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; text-align: right; color: #10233f; }
    .status.acertou { color: #0b6623; }
    .status.perdeu { color: #9d1212; }
    .status.aguardando { color: #475569; }

    /* Responsive: adapt ranking table for smaller screens */
    @media (max-width: 880px) {
      .ranking-row { grid-template-columns: 40px 1fr 84px; }
      .pontos { text-align: right; }
      .status { display: inline-flex; justify-content: flex-end; }
      .page-header-card { grid-template-columns: 1fr; }
      .page-actions { width: 100%; justify-self: stretch; }
      .page-title { width: 100%; }
      .select-wrapper { max-width: 100%; }
    }

    @media (max-width: 520px) {
      .ranking-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0; }
      .ranking-row span { white-space: normal; overflow: visible; color: #07131a !important; }
      .pos { width: 32px; flex: 0 0 32px; text-align: left; }
      .nome { flex: 1 1 auto; font-size: 0.95rem; }
      .pontos { display: none !important; }
      .status { display: inline-flex; flex: 0 0 auto; min-width: 72px; justify-content: center; padding: 0.35rem 0.7rem; border-radius: 0.65rem; background: rgba(11,102,35,0.18); color: #062d13 !important; font-weight: 700; }
      .status.acertou { background: rgba(11,102,35,0.22); color: #05320f !important; }
      .status.perdeu { background: rgba(166,0,0,0.18); color: #870000 !important; }
      .status.aguardando { background: rgba(71,85,105,0.08); color: #475569 !important; }
      .page-header-card { padding: 1.2rem 1rem 1rem; }
      .page-title { margin-top: 0.5rem; }
      .page-title p { margin-top: 0.35rem; }
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
    const resultadosDisponiveis = rodada.jogos.reduce((count, jogo) => count + (resultadosPorId.has(jogo.id) ? 1 : 0), 0);

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

    const sorted = rows.sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
    return sorted.map((r, i) => ({
      pos: i + 1,
      ...r,
      status: resultadosDisponiveis === 0 ? 'AGUARDANDO' : r.pontos > 0 ? 'ACERTOU' : 'PERDEU'
    }));
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
