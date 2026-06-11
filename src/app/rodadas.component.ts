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
        <p>Veja os palpites dos participantes e faça o seu. A classificação já considera: 3 pontos por resultado correto e +1 por placar exato.</p>
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
            <span>Exatos</span>
            <span>Acertos</span>
          </div>

          <div *ngFor="let item of ranking() | slice:0:6; let i = index" class="ranking-row">
            <span>{{ i + 1 }}</span>
            <span>{{ item.nome }}</span>
            <span>{{ item.pontos }}</span>
            <span>{{ item.exatos }}</span>
            <span>{{ item.acertos }}</span>
          </div>
        </div>
      </div>

      <div class="rodadas-container">
        <div *ngFor="let rodada of rodadas()" class="rodada-dia" [class.inativa]="rodadaEstaBloqueada(rodada)">
          <div class="rodada-header">
            <h2>📅 {{ rodada.dataFormatada }} ({{ rodada.diaSemana }})</h2>
            <span class="rodada-numero">🎯 Rodada {{ rodada.numero }}</span>
          </div>

          <div class="jogos-lista">
            <div *ngFor="let jogo of rodada.jogos" class="jogo-card">
              <div class="jogo-info">
                <div class="time">
                  <span class="time-nome">{{ jogo.time1 }}</span>
                </div>
                <div class="vs">
                  <span class="horario">{{ jogo.horario }}</span>
                </div>
                <div class="time">
                  <span class="time-nome">{{ jogo.time2 }}</span>
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
                <span class="vs-small">vs</span>
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
      gap: 2rem;
      margin-top: 1.5rem;
    }

    .rodada-dia {
      border: 1px solid rgba(1, 77, 30, 0.2);
      border-radius: 1.2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .rodada-dia.inativa {
      opacity: 0.75;
      pointer-events: none;
      background: rgba(245, 245, 245, 0.9);
    }

    .rodada-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(1, 150, 69, 0.2);
    }

    .rodada-header h2 { margin: 0; font-size: 1.3rem; color: #012169; }

    .jogos-lista { display: grid; gap: 1rem; margin-bottom: 1.5rem; }

    .jogo-card { display: grid; gap: 1rem; padding: 1rem; border: 1px solid rgba(1, 77, 30, 0.15); border-radius: 0.8rem; background: rgba(248,255,241,0.7); }

    .palpites-inputs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: center; }

    .palpite-input { padding: 0.7rem; border: 1px solid #009c45; border-radius: 0.6rem; text-align: center; font-weight: 700; font-size: 1rem; background: #ffffff; }

    .btn-salvar { width: 100%; padding: 0.8rem 1.2rem; border: none; border-radius: 0.8rem; background: #012169; color: white; font-weight: 700; cursor: pointer; }

    .rodada-bloqueada { margin-top: 0.8rem; font-weight: 700; color: #37526d; }

    .alert-feedback { margin-top: 1rem; padding: 0.9rem 1rem; border-radius: 0.75rem; background: rgba(1,150,69,0.12); border:1px solid rgba(1,150,69,0.2); }

    .modal-overlay { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.35); z-index: 40; }
    .modal-card { width: min(92%,420px); padding: 1.25rem; border-radius: 0.9rem; background: white; text-align: left; }

    .rodada-participantes { margin-top: 1rem; padding: 1rem; border-radius: 0.9rem; background:white; border:1px solid rgba(1,150,69,0.12); }

    .participante-card { display:grid; grid-template-columns: 180px 1fr; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid rgba(1,150,69,0.08); }
  `]
})
export class RodadasComponent implements OnInit {
  protected readonly rodadasService = inject(RodadasService);
  protected readonly resultadosService = inject(ResultadosService);
  protected readonly palpitesService = inject(PalpitesService);

  protected readonly rodadas = computed(() => this.rodadasService.getRodadasDoBrasil());
  palpites: { [key: string]: number } = {};
  protected readonly ranking = computed(() => this.palpitesService.getClassificacao(this.resultadosService.resultados()));
  protected readonly feedback = signal('');
  protected readonly modalMessage = signal('');

  ngOnInit(): void {
    this.carregarPalpitesLocais();
    effect(() => {
      this.palpites = this.palpitesService.getPalpitesUsuarioAtual();
    });
  }

  private carregarPalpitesLocais(): void {
    this.palpites = this.palpitesService.getPalpitesUsuarioAtual();
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
    this.modalMessage.set('Seu palpite foi salvo com sucesso. Esta rodada ficará inativa para você porque você já palpitou.');
    this.feedback.set('Seus palpites foram salvos.');
    setTimeout(() => this.feedback.set(''), 3000);
    setTimeout(() => this.modalMessage.set(''), 3000);
  }

  protected rodadaEstaBloqueada(rodada: Rodada): boolean {
    const participante = this.palpitesService.getParticipanteAtual();
    if (!participante) return false;

    return rodada.jogos.every(jogo =>
      this.temPlacarCompleto(participante.palpites, jogo.id)
    );
  }

  private temPlacarCompleto(palpites: { [key: string]: any }, jogoId: string): boolean {
    const palpiteA = palpites[jogoId];
    const palpiteB = palpites[jogoId + '-b'];
    return palpiteA !== undefined && palpiteA !== null && palpiteB !== undefined && palpiteB !== null;
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
}
