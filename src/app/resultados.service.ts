import { Injectable, signal } from '@angular/core';

export interface Resultado {
  partida: string;
  jogoId?: string;
  placarA: string;
  placarB: string;
  atualizadoEm: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {
  readonly resultados = signal<Resultado[]>(this.loadStoredResults());

  private loadStoredResults(): Resultado[] {
    try {
      const stored = localStorage.getItem('bolao-resultados');
      return stored ? JSON.parse(stored) as Resultado[] : [];
    } catch {
      return [];
    }
  }

  private persistResults(): void {
    localStorage.setItem('bolao-resultados', JSON.stringify(this.resultados()));
  }

  addResultado(partida: string, placarA: string, placarB: string, jogoId?: string): void {
    const novoResultado: Resultado = {
      partida: partida.trim(),
      jogoId: jogoId?.trim(),
      placarA: placarA.trim(),
      placarB: placarB.trim(),
      atualizadoEm: new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    if (!novoResultado.partida) {
      return;
    }

    this.resultados.set([novoResultado, ...this.resultados()]);
    this.persistResults();
  }

  clearResultados(): void {
    this.resultados.set([]);
    this.persistResults();
  }
}
