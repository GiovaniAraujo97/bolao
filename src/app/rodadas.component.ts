import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RodadasService, Rodada, Jogo } from './rodadas.service';
import { ResultadosService } from './resultados.service';
import { PalpitesService, PalpitesParticipante } from './palpites.service';

@Component({
  selector: 'app-rodadas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-rodadas">
      <header>
        <h1>🏟️ Rodadas</h1>
        <p>Veja os palpites dos participantes e faça o seu. A classificação já considera: 10 pontos para placar exato, 0 ponto caso apenas o vencedor esteja certo ou o palpite esteja errado.</p>
      </header>

      <div class="ranking-block" *ngIf="ranking().length > 0">
        <div class="ranking-topo">
          <div>
            <h2>🏅 Classificação do Bolão</h2>
            <p>Quem pontua mais está na frente.</p>
          </div>
          <span class="ranking-total">Participantes: {{ ranking().length }}</span>
        </div>

        <div class="ranking-table">
          <div class="ranking-row ranking-titulo">
            <span>#</span>
            <span>Nome</span>
            <span>Pontos</span>
            <span>Status</span>
          </div>

          <div *ngFor="let item of ranking() | slice:0:6; let i = index" class="ranking-row">
            <span>{{ i + 1 }}</span>
            <span>{{ item.nome }}</span>
            <span>{{ item.pontos }} pts</span>
            <span>{{ item.pontos === 10 ? 'ACERTOU' : 'PERDEU' }}</span>
          </div>
        </div>
      </div>

      <div class="rodadas-container">
        <div *ngFor="let rodada of rodadas()" class="rodada-dia" [class.inativa]="rodadaEstaBloqueada(rodada)">
          <div class="rodada-header">
            <h2>📅 {{ formatDateBR(rodada.data) }} ({{ rodada.diaSemana }})</h2>
            <span class="rodada-numero">🎯 Rodada {{ rodada.numero }}</span>
          </div>

          <div class="jogos-lista">
            <div *ngFor="let jogo of rodada.jogos" class="jogo-card">
              <div class="jogo-teams">
                <div class="team-card">
                  <img
                    [src]="teamImageUrl(jogo.time1)"
                    [alt]="jogo.time1"
                    class="team-logo"
                    (error)="onTeamImageError($event, jogo.time1)"
                  />
                  <span class="team-name">{{ jogo.time1 }}</span>
                </div>

                <div class="game-info">
                  <span class="horario">{{ jogo.horario }}</span>
                  <span class="vs-text">vs</span>
                </div>

                <div class="team-card">
                  <img
                    [src]="teamImageUrl(jogo.time2)"
                    [alt]="jogo.time2"
                    class="team-logo"
                    (error)="onTeamImageError($event, jogo.time2)"
                  />
                  <span class="team-name">{{ jogo.time2 }}</span>
                </div>
              </div>

              <div class="palpites-inputs">
                <input
                  type="number"
                  placeholder="0"
                  [(ngModel)]="palpites[jogo.id]"
                  class="palpite-input"
                  min="0"
                  [disabled]="rodadaEstaBloqueada(rodada)"
                />
                <span class="palpite-gap" aria-hidden="true"></span>
                <input
                  type="number"
                  placeholder="0"
                  [(ngModel)]="palpites[jogo.id + '-b']"
                  class="palpite-input"
                  min="0"
                  [disabled]="rodadaEstaBloqueada(rodada)"
                />
              </div>
            </div>
          </div>

          <div *ngIf="!rodadaEstaBloqueada(rodada)">
            <button class="btn-salvar" (click)="salvarPalpitesRodada(rodada)">
              Salvar Palpites da Rodada
            </button>
          </div>

          <div *ngIf="rodadaEstaBloqueada(rodada)" class="rodada-bloqueada">
            ✅ Você já salvou os palpites desta rodada. As opções estão inativas.
          </div>

          <div *ngIf="feedback()" class="alert-feedback">{{ feedback() }}</div>

          <div *ngIf="modalMessage()" class="modal-overlay">
            <div class="modal-card">
              <h3>Sucesso</h3>
              <p>{{ modalMessage() }}</p>
              <div style="text-align:right;margin-top:12px;">
                <button class="btn-save" (click)="closeModal()">Fechar</button>
              </div>
            </div>
          </div>

          <div *ngIf="participantesRodada(rodada).length > 0" class="rodada-participantes">
            <h3>Palpites da rodada</h3>
            <div *ngFor="let participante of participantesRodada(rodada)" class="participante-card">
              <span class="nome-participante">{{ participante.nome }}</span>
              <span class="texto-palpite">{{ palpiteResumoRodada(participante, rodada) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .rodadas-container {
      display: grid;
      gap: 1.25rem;
      margin-top: 1.25rem;
    }

    .rodada-dia {
      border: 1px solid rgba(1, 77, 30, 0.16);
      border-radius: 1.5rem;
      padding: 1.1rem;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }

    .rodada-dia:hover { transform: translateY(-2px); border-color: rgba(1, 77, 30, 0.24); }

    .rodada-dia.inativa {
      opacity: 0.85;
      pointer-events: none;
      background: rgba(246, 248, 247, 0.98);
    }

    .rodada-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.65rem;
      margin-bottom: 1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid rgba(1, 150, 69, 0.18);
    }

    .rodada-header h2 {
      margin: 0;
      font-size: 1.18rem;
      color: #012169;
      line-height: 1.2;
    }

    .rodada-header .rodada-numero {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.55rem 0.95rem;
      border-radius: 999px;
      background: rgba(1, 150, 69, 0.14);
      color: #065a14;
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .jogos-lista {
      display: grid;
      gap: 0.85rem;
      margin-bottom: 1rem;
    }

    .jogo-card {
      display: grid;
      gap: 0.85rem;
      padding: 1rem;
      border: 1px solid rgba(1, 77, 30, 0.14);
      border-radius: 1.2rem;
      background: rgba(255, 255, 255, 0.98);
      justify-items: center;
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
    }

    .jogo-teams {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      flex-wrap: nowrap;
      min-width: 0;
    }

    .team-card {
      display: grid;
      gap: 0.45rem;
      align-items: center;
      justify-items: center;
      flex: 1 1 0;
      min-width: 0;
      max-width: 120px;
      width: 100%;
    }

    .team-logo {
      width: 54px;
      height: 54px;
      object-fit: contain;
      border-radius: 16px;
      background: #ffffff;
      border: 1px solid rgba(1, 77, 30, 0.16);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
    }

    .team-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: #10233f;
      max-width: 100%;
      white-space: normal;
      overflow-wrap: break-word;
      text-align: center;
    }

    .game-info {
      display: grid;
      gap: 0.15rem;
      align-items: center;
      justify-items: center;
      min-width: 64px;
      width: 64px;
    }
    
    .team-card:first-child { order: 0; }
    .team-card:last-child { order: 2; }

    .horario {
      font-size: 0.92rem;
      color: #065a14;
      font-weight: 700;
    }

    .vs-text {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: rgba(1, 150, 69, 0.18);
      color: #009c45;
      font-weight: 800;
      font-size: 0.92rem;
    }

    .palpites-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      align-items: center;
    }

    .palpite-gap { display: none; }

    .palpite-input {
      width: 100%;
      min-width: 0;
      height: 44px;
      padding: 0.4rem 0.6rem;
      border: 1px solid rgba(1, 77, 30, 0.18);
      border-radius: 0.75rem;
      text-align: center;
      font-weight: 800;
      font-size: 0.95rem;
      background: #f9fdf5;
      color: #10233f;
    }

    .btn-salvar {
      width: 100%;
      padding: 0.9rem 1rem;
      border: none;
      border-radius: 1rem;
      background: #012169;
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .btn-salvar:hover { background: #08337b; transform: translateY(-1px); }

    .rodada-bloqueada {
      margin-top: 0.9rem;
      color: #37526d;
      font-weight: 700;
    }

    .alert-feedback {
      margin-top: 0.9rem;
      padding: 0.9rem 1rem;
      border-radius: 0.85rem;
      background: rgba(1, 150, 69, 0.14);
      border: 1px solid rgba(1, 150, 69, 0.22);
      color: #134b21;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.32);
      z-index: 40;
    }

    .modal-card {
      width: min(92%, 420px);
      padding: 1.25rem;
      border-radius: 1rem;
      background: #ffffff;
      text-align: left;
    }

    .rodada-participantes {
      margin-top: 0.75rem;
      padding: 0.75rem;
      border-radius: 1.1rem;
      background: #ffffff;
      border: 1px solid rgba(1, 150, 69, 0.14);
      display: grid;
      gap: 0.5rem;
    }

    .rodada-participantes h3 {
      margin: 0;
      font-size: 0.95rem;
      color: #065a14;
      font-weight: 700;
    }

    .participante-card {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.25rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(1, 150, 69, 0.1);
    }

    .participante-card:last-child { border-bottom: none; }
    .participante-card .nome-participante { font-weight: 700; color: #10233f; margin: 0; }
    .participante-card .texto-palpite { color: #3e5066; font-size: 0.95rem; line-height: 1.5; margin: 0; }

    .ranking-block {
      display: grid;
      gap: 0.85rem;
      padding: 1rem;
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(1, 77, 30, 0.16);
    }

    .ranking-topo {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.85rem;
      align-items: center;
    }

    .ranking-topo h2 { margin: 0; font-size: 1.02rem; }
    .ranking-topo p { margin: 0; color: #37526d; }

    .ranking-total {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.8rem;
      border-radius: 999px;
      background: rgba(1, 150, 69, 0.14);
      color: #065a14;
      font-weight: 700;
      white-space: nowrap;
    }

    .ranking-table { overflow-x: auto; }

    .ranking-row {
      display: grid;
      grid-template-columns: 0.65fr 1.3fr 0.85fr 0.95fr;
      gap: 0.85rem;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(1, 150, 69, 0.1);
    }

    .ranking-row.ranking-titulo {
      color: #065a14;
      font-weight: 800;
      border-bottom: 1px solid rgba(1, 150, 69, 0.18);
    }

    .ranking-row span {
      min-width: 0;
      color: #10233f;
      font-size: 0.95rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ranking-row:last-child { border-bottom: none; }

    @media (max-width: 880px) {
      .rodadas-container { gap: 1rem; }
      .rodada-dia { padding: 1rem; }
      .rodada-header { flex-direction: column; align-items: flex-start; }
      .rodada-header h2 { font-size: 1.08rem; }
      .rodada-header .rodada-numero { font-size: 0.86rem; padding: 0.45rem 0.8rem; }
      .jogos-lista { gap: 0.75rem; }
      .jogo-card { padding: 0.9rem; }
      .jogo-teams { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; width: 100%; }
      .team-card { flex: 1 1 110px; min-width: 92px; max-width: 140px; }
      .game-info { display: grid; gap: 0.35rem; align-items: center; justify-items: center; width: 60px; }
      .vs-text { width: auto; height: auto; padding: 0.35rem 0.75rem; }
      .palpites-inputs { grid-template-columns: 1fr 1fr; }
      .palpite-input { width: 100%; }
      .btn-salvar { padding: 0.85rem 1rem; }
      .ranking-row { grid-template-columns: 0.9fr 1.3fr 1fr; }
      .ranking-row span:nth-child(4) { display: none; }
      .participante-card { gap: 0.5rem; }
      .ranking-topo { flex-direction: column; align-items: flex-start; }
    }

    @media (max-width: 520px) {
      .rodada-dia { padding: 0.85rem; }
      .rodada-header h2 { font-size: 1rem; }
      .team-logo { width: 48px; height: 48px; }
      .team-name { font-size: 0.8rem; max-width: 100%; }
      .palpite-input { height: 38px; font-size: 0.9rem; }
      .jogo-teams { flex-wrap: nowrap; gap: 0.6rem; justify-content: space-between; }
      .team-card { max-width: 100px; width: 100%; flex: 1 1 0; }
      .game-info { width: 58px; }
      .jogo-card { padding: 0.85rem; }
      .ranking-row { grid-template-columns: 1fr 1.2fr; }
      .ranking-row span:nth-child(3), .ranking-row span:nth-child(4) { display: none; }
      .rodada-participantes { padding: 0.9rem; }
      .participante-card { gap: 0.4rem; padding: 0.7rem 0; }
    }

    @media print {
      .rodada-dia,
      .jogo-card,
      .rodada-participantes {
        box-shadow: none !important;
      }

      .rodada-participantes {
        margin-top: 0.6rem !important;
        padding: 0.75rem !important;
        border-color: rgba(0, 0, 0, 0.12) !important;
        background: #ffffff !important;
      }

      .participante-card {
        gap: 0.3rem !important;
        padding: 0.55rem 0 !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
      }

      .rodada-header,
      .jogos-lista,
      .jogo-card,
      .palpites-inputs {
        page-break-inside: avoid;
      }
    }
  `]
})
export class RodadasComponent implements OnInit {
  protected readonly rodadasService = inject(RodadasService);
  protected readonly resultadosService = inject(ResultadosService);
  protected readonly palpitesService = inject(PalpitesService);

  protected readonly palpiteSync = effect(() => {
    const stored = this.palpitesService.getPalpitesUsuarioAtual();
    this.palpites = stored ? { ...stored } : {};
  });

  // Quando o serviço de palpites fornece valores já persistidos para o usuário,
  // marca automaticamente as rodadas correspondentes como salvas para desativar o botão.
  protected readonly savedFromParticipantEffect = effect(() => {
    const stored = this.palpitesService.getPalpitesUsuarioAtual();
    if (!stored) return;

    const computed: number[] = [];
    this.rodadas().forEach(rodada => {
      const all = rodada.jogos.every(jogo =>
        stored[jogo.id] !== undefined && stored[jogo.id + '-b'] !== undefined
      );
      if (all) computed.push(rodada.numero);
    });

    if (computed.length === 0) return;

    const merged = Array.from(new Set([...this.savedRodadas(), ...computed]));
    if (this.arraysAreEqual(merged, this.savedRodadas())) {
      return;
    }

    this.savedRodadas.set(merged);
    this.persistSavedRodadas(merged);
  });

  // rodadas que foram bloqueadas localmente após salvar (resposta imediata)
  protected readonly blockedRodadas = signal<number[]>([]);
  protected readonly savedRodadas = signal<number[]>([]);

  protected readonly rodadas = computed(() => this.rodadasService.getRodadasDoBrasil());
  palpites: { [key: string]: number } = {};
  protected readonly ranking = computed(() => this.palpitesService.getClassificacao(this.resultadosService.resultados()));
  protected readonly feedback = signal('');
  protected readonly modalMessage = signal('');

  private normalizeTeamName(team: string): string {
    return team
      .trim()
      .normalize('NFD')
      .replace(/[ -]/g, ch => ch.normalize('NFD').replace(/\p{Diacritic}/gu, ''))
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

  ngOnInit(): void {
    this.carregarPalpitesLocais();
    // carrega savedRodadas específico do usuário atual
    this.savedRodadas.set(this.loadSavedRodadas());
  }

  private storageKeyForUser(): string {
    try {
      const email = this.palpitesService.getCurrentUserEmail() || 'anon';
      return `bolao-saved-rodadas:${email}`;
    } catch (e) {
      return 'bolao-saved-rodadas:anon';
    }
  }

  private loadSavedRodadas(): number[] {
    if (typeof window === 'undefined') return [];
    try {
      const key = this.storageKeyForUser();
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as number[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  private persistSavedRodadas(list: number[]): void {
    if (typeof window === 'undefined') return;
    try {
      const key = this.storageKeyForUser();
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
  }

  private carregarPalpitesLocais(): void {
    const stored = this.palpitesService.getPalpitesUsuarioAtual();
    // evita mutação por referência: cria cópia para que editar inputs não altere
    // imediatamente o objeto `participante.palpites` até o usuário clicar em salvar
    this.palpites = stored ? { ...stored } : {};
  }

  protected async salvarPalpitesRodada(rodada: Rodada): Promise<void> {
    const palpitesRodada: { [key: string]: number } = {};

    rodada.jogos.forEach(jogo => {
      const valorA = Number(this.palpites[jogo.id]);
      const valorB = Number(this.palpites[jogo.id + '-b']);

      if (!Number.isNaN(valorA) && !Number.isNaN(valorB)) {
        palpitesRodada[jogo.id] = valorA;
        palpitesRodada[jogo.id + '-b'] = valorB;
        this.palpites[jogo.id] = valorA;
        this.palpites[jogo.id + '-b'] = valorB;
      }
    });

    if (Object.keys(palpitesRodada).length === 0) {
      this.feedback.set('Informe os palpites corretamente antes de salvar.');
      setTimeout(() => this.feedback.set(''), 3000);
      return;
    }

    await this.palpitesService.savePalpitesDoUsuarioAtual(palpitesRodada);
    // atualiza cache local e mostra modal
    this.palpites = this.palpitesService.getPalpitesUsuarioAtual();
    // marca rodada como bloqueada localmente para efeito imediato na UI
    if (!this.blockedRodadas().includes(rodada.numero)) {
      this.blockedRodadas.set([rodada.numero, ...this.blockedRodadas()]);
    }
    // marca como efetivamente salva (persistida localmente)
    if (!this.savedRodadas().includes(rodada.numero)) {
      const next = [rodada.numero, ...this.savedRodadas()];
      this.savedRodadas.set(next);
      this.persistSavedRodadas(next);
    }
    this.modalMessage.set('Seu palpite foi salvo com sucesso. Esta rodada ficará inativa para você porque você já palpitou.');
    this.feedback.set('Seus palpites foram salvos.');
    setTimeout(() => this.feedback.set(''), 3000);
    setTimeout(() => this.modalMessage.set(''), 3000);
  }

  protected rodadaEstaBloqueada(rodada: Rodada): boolean {
    // Bloqueia se:
    // - o usuário já salvou explicitamente nessa instância (savedRodadas),
    // - a rodada foi bloqueada na sessão atual (blockedRodadas),
    // - ou se o backend/participante atual já possui palpites completos para esta rodada.
    if (this.savedRodadas().includes(rodada.numero)) return true;
    if (this.blockedRodadas().includes(rodada.numero)) return true;
    if (this.usuarioSalvouRodada(rodada)) return true;
    return false;
  }

  private usuarioSalvouRodada(rodada: Rodada): boolean {
    try {
      const participante = this.palpitesService.getParticipanteAtual();
      if (!participante) return false;
      return rodada.jogos.every(jogo =>
        participante.palpites[jogo.id] !== undefined && participante.palpites[jogo.id + '-b'] !== undefined
      );
    } catch (e) {
      return false;
    }
  }

  private temPlacarCompleto(palpites: { [key: string]: any }, jogoId: string): boolean {
    const palpiteA = palpites[jogoId];
    const palpiteB = palpites[jogoId + '-b'];
    const complete = palpiteA !== undefined && palpiteA !== null && palpiteB !== undefined && palpiteB !== null;
    try {
      console.debug('[temPlacarCompleto] jogoId=', jogoId, 'palpiteA=', palpiteA, 'palpiteB=', palpiteB, 'complete=', complete);
    } catch (e) {}
    return complete;
  }

  protected participantesRodada(rodada: Rodada): PalpitesParticipante[] {
    return this.palpitesService.getParticipantesDaRodada(rodada);
  }

  protected palpiteResumoRodada(participante: PalpitesParticipante, rodada: Rodada): string {
    const itens = rodada.jogos
      .map(jogo => {
        const palpiteA = participante.palpites[jogo.id];
        const palpiteB = participante.palpites[jogo.id + '-b'];
        if (palpiteA === undefined || palpiteB === undefined) return null;
        return `${jogo.time1} ${palpiteA} x ${palpiteB} ${jogo.time2}`;
      })
      .filter((i): i is string => i !== null);

    return itens.length > 0 ? itens.join(' • ') : 'Nenhum palpite registrado nesta rodada.';
  }

  protected closeModal(): void {
    this.modalMessage.set('');
  }

  private arraysAreEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
