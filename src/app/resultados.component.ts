import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultadosService } from './resultados.service';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page page-resultados">
      <header>
        <h1>🏆 Resultados</h1>
        <p>Confira os placares oficiais das partidas. O ranking é atualizado automaticamente.</p>
      </header>

      <div class="intro-block" *ngIf="resultadosService.resultados().length === 0">
        <p>📊 O administrador ainda não cadastrou resultados. Volte em breve para acompanhar os placares!</p>
      </div>

      <div *ngIf="resultadosService.resultados().length > 0" class="resultados-container">
        <div class="resumo-info">
          <div class="info-item">
            <span class="info-label">Resultados Lançados</span>
            <span class="info-valor">{{ resultadosService.resultados().length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Última Atualização</span>
            <span class="info-valor">{{ ultimaAtualizacao() }}</span>
          </div>
        </div>

        <div class="resultados-grid">
          <article class="resultado-card" *ngFor="let resultado of resultadosService.resultados()">

            <div class="resultado-placar">
              <span class="placar-principal">{{ resultado.placarA }} x {{ resultado.placarB }}</span>
            </div>

            <div class="resultado-times-imagens">
              <div class="time-img">
                <img [src]="imageUrl(teamName(resultado.partida, 0))" (error)="onImageError($event, teamName(resultado.partida, 0))" alt="time1" />
                <span class="time-label">{{ teamName(resultado.partida, 0) }}</span>
              </div>
              <div class="time-img">
                <img [src]="imageUrl(teamName(resultado.partida, 1))" (error)="onImageError($event, teamName(resultado.partida, 1))" alt="time2" />
                <span class="time-label">{{ teamName(resultado.partida, 1) }}</span>
              </div>
            </div>

            <div class="resultado-footer">
              <span class="timestamp">{{ formatarHora(resultado.atualizadoEm) }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .resultados-container {
      margin-top: 1.5rem;
    }

    .resumo-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-item {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 0.8rem;
      background: rgba(1, 150, 69, 0.08);
      border: 1px solid rgba(1, 150, 69, 0.2);
      text-align: center;
    }

    .info-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #37526d;
      letter-spacing: 0.03em;
    }

    .info-valor {
      display: block;
      font-size: 1.6rem;
      font-weight: 900;
      color: #009c45;
    }

    .resultados-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .resultado-card {
      display: grid;
      gap: 1rem;
      padding: 1.2rem;
      border-radius: 0.8rem;
      background: linear-gradient(135deg, rgba(1, 150, 69, 0.08) 0%, rgba(248, 255, 241, 0.9) 100%);
      border: 1px solid rgba(1, 150, 69, 0.2);
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .resultado-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(1, 150, 69, 0.15);
    }

    .resultado-header h3 {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: #10233f;
      line-height: 1.4;
    }

    .resultado-placar {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 0.6rem;
      border: 1px solid rgba(1, 150, 69, 0.15);
    }

    .placar-principal {
      font-size: 1.8rem;
      font-weight: 900;
      color: #012169;
      text-align: center;
    }

    .resultado-footer {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timestamp {
      font-size: 0.75rem;
      color: #37526d;
      font-weight: 600;
    }

    .resultado-times-imagens {
      display: flex;
      justify-content: space-around;
      gap: 1rem;
      align-items: center;
      margin-top: 0.5rem;
    }

    .time-img {
      display: grid;
      gap: 0.25rem;
      align-items: center;
      justify-items: center;
    }

    .time-img img {
      width: 56px;
      height: 56px;
      object-fit: contain;
      border-radius: 6px;
      background: white;
      border: 1px solid rgba(0,0,0,0.06);
    }

    .time-label {
      font-size: 0.7rem;
      color: #10233f;
      font-weight: 700;
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 760px) {
      .resultados-grid {
        grid-template-columns: 1fr;
      }

      .resumo-info {
        grid-template-columns: 1fr 1fr;
      }

      .resultado-card {
        padding: 1rem;
      }

      .placar-principal {
        font-size: 1.6rem;
      }

      .resultado-header h3 {
        font-size: 0.85rem;
      }
    }
  `]
})
export class ResultadosComponent implements OnInit {
  protected readonly resultadosService = inject(ResultadosService);
  
  // Extrai nome do time a partir da string de partida (ex: "Brasil x Croácia").
  teamName(partida: string, index: 0 | 1): string {
    if (!partida) return '';
    const sep = partida.includes(' x ') ? ' x ' : partida.includes(' X ') ? ' X ' : ' x ';
    const parts = partida.split(sep).map(p => p.trim());
    return parts[index] || '';
  }

  private normalizeTeamName(team: string): string {
    if (!team) return '';
    return team
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  imageUrl(teamNameRaw: string, ext = 'png'): string {
    if (!teamNameRaw) return '';
    const normalized = this.normalizeTeamName(teamNameRaw);
    return `/${encodeURIComponent(normalized)}.${ext}`;
  }

  onImageError(event: any, teamNameRaw: string): void {
    try {
      const img = event?.target as HTMLImageElement;
      if (!img) return;
      const normalized = this.normalizeTeamName(teamNameRaw);
      if (img.src.endsWith('.png')) {
        img.src = `/${encodeURIComponent(normalized)}.jpg`;
        return;
      }
      if (img.src.endsWith('.jpg')) {
        img.src = `/${encodeURIComponent(normalized)}.jpeg`;
        return;
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnInit(): void {
    // Carrega automaticamente ao iniciar
  }

  ultimaAtualizacao(): string {
    const resultados = this.resultadosService.resultados();
    if (resultados.length === 0) return 'N/A';
    const times = resultados
      .map(r => {
        const t = Date.parse(r.atualizadoEm);
        return isNaN(t) ? null : t;
      })
      .filter((t): t is number => t !== null);

    if (times.length === 0) return 'N/A';

    const recent = new Date(Math.max(...times));
    return this.formatarHora(recent.toISOString());
  }

  formatarHora(data: string): string {
    try {
      const d = new Date(data);
      const agora = new Date();
      const diff = agora.getTime() - d.getTime();
      const minutos = Math.floor(diff / 60000);
      const horas = Math.floor(diff / 3600000);
      const dias = Math.floor(diff / 86400000);

      if (minutos < 1) return 'Agora';
      if (minutos < 60) return `${minutos}min atrás`;
      if (horas < 24) return `${horas}h atrás`;
      if (dias < 7) return `${dias}d atrás`;

      return d.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }
}
