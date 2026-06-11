import { Injectable, effect, signal } from '@angular/core';
import { supabase } from './supabase.client';
import { AuthService } from './auth.service';
import { RodadasService, Rodada } from './rodadas.service';
import { Resultado } from './resultados.service';

export interface PalpitesParticipante {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
  palpites: { [key: string]: number };
}

export interface ClassificacaoUsuario {
  id: string;
  nome: string;
  email: string;
  pontos: number;
  acertos: number;
  exatos: number;
  palpitesRegistrados: number;
}

interface PalpiteRegistro {
  user_id: string;
  user_name: string;
  email: string;
  jogo_id: string;
  placar_a: number;
  placar_b: number;
  rodada_numero: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PalpitesService {
  private participantes = signal<PalpitesParticipante[]>([]);
  private readonly STORAGE_KEY = 'bolao-palpites-rodadas-participantes';
  private readonly LEGACY_STORAGE_KEY = 'bolao-palpites-rodadas';

  constructor(
    private readonly authService: AuthService,
    private readonly rodadasService: RodadasService
  ) {
    this.initialize();
    effect(() => {
      this.authService.user();
      this.loadParticipantes();
    });
  }

  getParticipantes(): PalpitesParticipante[] {
    return [...this.participantes()];
  }

  getParticipanteAtual(): PalpitesParticipante | undefined {
    const user = this.authService.user();
    const email = user?.email?.trim().toLowerCase() || this.getAnonimoEmail();
    return this.participantes().find(p => p.email === email);
  }

  getNomeParticipanteAtual(): string {
    const atual = this.getParticipanteAtual();
    if (atual) {
      return atual.nome;
    }
    const user = this.authService.user();
    return this.deriveNome(user?.email);
  }

  async savePalpitesDoUsuarioAtual(palpites: { [key: string]: number }): Promise<void> {
    const user = this.authService.user();
    const email = user?.email?.trim().toLowerCase() || this.getAnonimoEmail();
    const userId = user?.id || email;
    const nome = this.deriveNome(user?.email);

    const jogoIds = Array.from(
      new Set(
        Object.keys(palpites).map(key => key.endsWith('-b') ? key.slice(0, -2) : key)
      )
    );

    const rows = jogoIds
      .map(jogoId => {
        const placarA = palpites[jogoId];
        const placarB = palpites[jogoId + '-b'];
        const rodada = this.rodadasService.getRodadas().find(r =>
          r.jogos.some(jogo => jogo.id === jogoId)
        );

        return {
          user_id: userId,
          email,
          user_name: nome,
          jogo_id: jogoId,
          placar_a: placarA,
          placar_b: placarB,
          rodada_numero: rodada?.numero ?? 0
        };
      })
      .filter(row => row.placar_a !== undefined && row.placar_b !== undefined);

    if (rows.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('palpites')
      .upsert(rows, { onConflict: 'user_id,jogo_id' });

    if (error) {
      console.error('Falha ao salvar palpites no Supabase:', error);
      return;
    }

    await this.loadParticipantes();
  }

  getParticipantesDaRodada(rodada: Rodada): PalpitesParticipante[] {
    return this.participantes().filter(participante =>
      rodada.jogos.some(jogo =>
        participante.palpites[jogo.id] !== undefined && participante.palpites[jogo.id + '-b'] !== undefined
      )
    );
  }

  getPalpite(participante: PalpitesParticipante, jogoId: string): number | undefined {
    return participante.palpites[jogoId];
  }

  getPalpitesUsuarioAtual(): { [key: string]: number } {
    return this.getParticipanteAtual()?.palpites ?? {};
  }

  getClassificacao(resultados: Resultado[]): ClassificacaoUsuario[] {
    const resultadosPorId = new Map(
      resultados
        .filter((resultado): resultado is Resultado & { jogoId: string } => !!resultado.jogoId)
        .map(resultado => [resultado.jogoId, resultado] as const)
    );

    return this.participantes()
      .map(participante => {
        const jogosIds = Array.from(
          new Set(
            Object.keys(participante.palpites).map(key =>
              key.endsWith('-b') ? key.slice(0, -2) : key
            )
          )
        );

        let pontos = 0;
        let acertos = 0;
        let exatos = 0;
        let palpitesRegistrados = 0;

        jogosIds.forEach(jogoId => {
          const palpiteA = participante.palpites[jogoId];
          const palpiteB = participante.palpites[jogoId + '-b'];
          if (palpiteA === undefined || palpiteB === undefined) {
            return;
          }

          const resultado = resultadosPorId.get(jogoId);
          if (!resultado) {
            palpitesRegistrados += 1;
            return;
          }

          const placarA = parseInt(resultado.placarA, 10);
          const placarB = parseInt(resultado.placarB, 10);
          const acertouExato = palpiteA === placarA && palpiteB === placarB;
          const resultadoPalpite = Math.sign(palpiteA - palpiteB);
          const resultadoReal = Math.sign(placarA - placarB);

          if (resultadoPalpite === resultadoReal) {
            pontos += 3;
            acertos += 1;
          }

          if (acertouExato) {
            pontos += 1;
            exatos += 1;
          }

          palpitesRegistrados += 1;
        });

        return {
          id: participante.id,
          nome: participante.nome,
          email: participante.email,
          pontos,
          acertos,
          exatos,
          palpitesRegistrados
        };
      })
      .sort((a, b) =>
        b.pontos - a.pontos ||
        b.exatos - a.exatos ||
        b.acertos - a.acertos ||
        a.nome.localeCompare(b.nome)
      );
  }

  private async initialize(): Promise<void> {
    await this.loadParticipantes();
  }

  private async loadParticipantes(): Promise<void> {
    if (typeof window === 'undefined') {
      this.participantes.set([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('palpites')
        .select('user_id, email, user_name, jogo_id, placar_a, placar_b, rodada_numero, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Falha ao carregar palpites do Supabase:', error);
        this.participantes.set([]);
        return;
      }

      if (!Array.isArray(data)) {
        this.participantes.set([]);
        return;
      }

      const participantesMap = new Map<string, PalpitesParticipante>();

      data.forEach((row: PalpiteRegistro) => {
        const participante: PalpitesParticipante = participantesMap.get(row.user_id) ?? {
          id: row.user_id,
          nome: row.user_name,
          email: row.email,
          criadoEm: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          palpites: {}
        };

        participante.palpites[row.jogo_id] = row.placar_a;
        participante.palpites[`${row.jogo_id}-b`] = row.placar_b;
        participantesMap.set(row.user_id, participante);
      });

      this.participantes.set(Array.from(participantesMap.values()));
    } catch (error) {
      console.error('Erro inesperado ao carregar palpites:', error);
      this.participantes.set([]);
    }
  }

  private deriveNome(email?: string | null): string {
    if (!email) {
      return 'Você';
    }

    const nome = email.split('@')[0].replace(/[._\-\d]/g, ' ').trim();
    return nome ? nome.charAt(0).toUpperCase() + nome.slice(1) : email;
  }

  private getAnonimoEmail(): string {
    if (typeof window === 'undefined') {
      return 'anonimo@bolao.local';
    }

    let anonId = localStorage.getItem('bolao-usuario-anonimo');
    if (!anonId) {
      anonId = `anonimo-${Math.random().toString(36).slice(2, 10)}@bolao.local`;
      localStorage.setItem('bolao-usuario-anonimo', anonId);
    }
    return anonId;
  }
}
