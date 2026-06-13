import { Injectable, signal } from '@angular/core';
import { supabase } from './supabase.client';

interface ResultadoRow {
  id?: string;
  partida: string;
  jogo_id?: string;
  placar_a: string;
  placar_b: string;
  atualizado_em?: string;
}

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
  private readonly STORAGE_KEY = 'bolao-resultados';

  constructor() {
    // tenta inicializar do Supabase e assinar realtime; se falhar, permanecemos com o local
    this.initialize();
  }

  private loadStoredResults(): Resultado[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) as Resultado[] : [];
    } catch {
      return [];
    }
  }

  private persistResults(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.resultados()));
  }

  async addResultado(partida: string, placarA: string | number, placarB: string | number, jogoId?: string): Promise<boolean> {
    const novoResultado: Resultado = {
      partida: partida.trim(),
      jogoId: jogoId?.trim(),
      placarA: String(placarA).trim(),
      placarB: String(placarB).trim(),
      atualizadoEm: new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    if (!novoResultado.partida) {
      return false;
    }

    // atualiza otimista localmente
    this.resultados.set([novoResultado, ...this.resultados()]);
    this.persistResults();

    try {
      console.debug('[addResultado] salvando resultado no supabase:', novoResultado);
    } catch (e) {}

    const persisted = await this.saveResultadoToSupabase(novoResultado);
    if (!persisted) {
      console.warn('Resultado salvo localmente mas não persistido no Supabase:', novoResultado);
      return false;
    }

    return true;
  }

  clearResultados(): void {
    this.resultados.set([]);
    this.persistResults();
  }

  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { data, error } = await supabase
        .from('resultados')
        .select('partida,jogo_id,placar_a,placar_b,atualizado_em')
        .order('atualizado_em', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const resultadosMap = new Map<string, Resultado>();
        for (const r of data) {
          const mappedResult: Resultado = {
            partida: r.partida,
            jogoId: r.jogo_id,
            placarA: r.placar_a,
            placarB: r.placar_b,
            atualizadoEm: r.atualizado_em || new Date().toLocaleString('pt-BR')
          };
          const key = mappedResult.jogoId ?? mappedResult.partida.toLowerCase();
          if (!resultadosMap.has(key)) {
            resultadosMap.set(key, mappedResult);
          }
        }
        this.resultados.set(Array.from(resultadosMap.values()));
        this.persistResults();
      }

      // subscribe realtime and also provide a polling fallback so other clients
      // see updates even when realtime doesn't propagate reliably.
      const refreshResults = async () => {
        try {
          const { data: d, error: refreshError } = await supabase
            .from('resultados')
            .select('partida,jogo_id,placar_a,placar_b,atualizado_em')
            .order('atualizado_em', { ascending: false });

          if (refreshError) {
            console.error('Falha ao recarregar resultados do Supabase:', refreshError);
            return;
          }

          if (!Array.isArray(d)) {
            return;
          }

          const resultadosMap = new Map<string, Resultado>();
          for (const r of d) {
            const mappedResult: Resultado = {
              partida: r.partida,
              jogoId: r.jogo_id,
              placarA: r.placar_a,
              placarB: r.placar_b,
              atualizadoEm: r.atualizado_em || new Date().toLocaleString('pt-BR')
            };
            const key = mappedResult.jogoId ?? mappedResult.partida.toLowerCase();
            if (!resultadosMap.has(key)) {
              resultadosMap.set(key, mappedResult);
            }
          }

          this.resultados.set(Array.from(resultadosMap.values()));
          this.persistResults();
        } catch (e) {
          console.error('Erro em refreshResults:', e);
        }
      };

      try {
        const channel = supabase.channel('public:resultados');
        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'resultados' }, refreshResults);
        channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'resultados' }, refreshResults);
        channel.subscribe();
      } catch (e) {
        console.debug('Realtime channel not available for resultados:', e);
      }

      // fallback polling every 7s to ensure clients pick up admin saves
      try {
        setInterval(refreshResults, 7000);
      } catch (e) {
        console.debug('Não foi possível iniciar polling de resultados:', e);
      }
    } catch (err) {
      console.debug('Não foi possível inicializar resultados do Supabase, mantendo local:', err);
    }
  }

  private async saveResultadoToSupabase(resultado: Resultado): Promise<boolean> {
    const row: ResultadoRow = {
      partida: resultado.partida,
      placar_a: resultado.placarA,
      placar_b: resultado.placarB,
      atualizado_em: new Date().toISOString()
    };
    if (resultado.jogoId) {
      row.jogo_id = resultado.jogoId;
    }

    try {
      try { console.debug('[saveResultadoToSupabase] upsert row:', row); } catch (e) {}

      const upsertPromise = supabase
        .from('resultados')
        .upsert([row], { onConflict: 'jogo_id' })
        .select('partida,jogo_id,placar_a,placar_b,atualizado_em');

      const { data, error } = await Promise.race([
        upsertPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out')), 15000))
      ]);

      try { console.debug('[saveResultadoToSupabase] upsert resposta:', { data, error }); } catch (e) {}

      if (error) {
        console.error('Falha ao salvar resultado no Supabase:', error, { row });
        this.persistResults();
        return false;
      }

      if (!Array.isArray(data)) {
        console.warn('Upsert retornou dados inesperados no Supabase:', data, { row });
        return false;
      }

      const mapped = data.map((r: any) => ({
        partida: r.partida,
        jogoId: r.jogo_id,
        placarA: r.placar_a,
        placarB: r.placar_b,
        atualizadoEm: r.atualizado_em || new Date().toLocaleString('pt-BR')
      }));

      const remaining = this.resultados().filter(existing => existing.jogoId !== resultado.jogoId);
      this.resultados.set([...remaining, ...mapped]);
      this.persistResults();
      return true;
    } catch (e) {
      console.error('Erro ao salvar resultado no Supabase:', e, { row });
      this.persistResults();
      return false;
    }
  }
}
