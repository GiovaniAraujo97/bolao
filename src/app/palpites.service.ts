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
  pos?: number;
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

    // configura listeners em tempo real para refletir alterações de palpites
    try {
      // usa canal público para escutar alterações em `palpites`
      const channel = supabase.channel('public:palpites');
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'palpites' }, () => {
        // recarrega participantes quando houver mudança
        this.loadParticipantes();
      });
      channel.subscribe();
    } catch (e) {
      // não bloqueia a inicialização se realtime não estiver disponível
      console.debug('Realtime channel not available for palpites:', e);
    }
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
    const display = this.authService.displayName?.();
    if (display) return display;
    const user = this.authService.user();
    return this.deriveNome(user?.email);
  }

  async savePalpitesDoUsuarioAtual(palpites: { [key: string]: number }): Promise<void> {
    const user = this.authService.user();
    const email = user?.email?.trim().toLowerCase() || this.getAnonimoEmail();
    const userId = user?.id || email;
    const nome = this.authService.displayName?.() || this.deriveNome(user?.email);

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

    try {
      try {
        console.debug('[savePalpitesDoUsuarioAtual] preparando upsert rows:', rows);
      } catch (e) {}

      const { data: upsertData, error } = await supabase
        .from('palpites')
        .upsert(rows, { onConflict: 'user_id,jogo_id' })
        .select('user_id,jogo_id,placar_a,placar_b');

      try {
        console.debug('[savePalpitesDoUsuarioAtual] upsert resultado:', { upsertData, error });
      } catch (e) {}

      if (error) {
        console.error('Falha ao salvar palpites no Supabase:', error);
        // fallback local quando tabela ausente
        const participantes = this.participantes();
        const userEmail = email;
        const existente = participantes.find(p => p.email === userEmail);
        if (existente) {
          rows.forEach(r => {
            existente.palpites[r.jogo_id] = r.placar_a;
            existente.palpites[`${r.jogo_id}-b`] = r.placar_b;
          });
        } else {
          const novo: PalpitesParticipante = {
            id: userId,
            nome,
            email: userEmail,
            criadoEm: new Date().toISOString(),
            palpites: {}
          };
          rows.forEach(r => {
            novo.palpites[r.jogo_id] = r.placar_a;
            novo.palpites[`${r.jogo_id}-b`] = r.placar_b;
          });
          participantes.unshift(novo);
        }
        this.participantes.set(participantes);
        this.saveToStorage(this.participantes());
        return;
      }

      // atualização otimista local: mescla os palpites no participante atual ou cria um novo
        const atual = this.getParticipanteAtual();
      if (atual) {
        const novo = { ...atual, palpites: { ...atual.palpites } } as PalpitesParticipante;
        rows.forEach(r => {
          novo.palpites[r.jogo_id] = r.placar_a;
          novo.palpites[`${r.jogo_id}-b`] = r.placar_b;
        });

        const others = this.participantes().filter(p => p.email !== novo.email);
        this.participantes.set([novo, ...others]);
      } else {
        // cria participante temporário local para refletir imediatamente na UI
        const novoEmail = email;
        const novoId = userId;
        const novo: PalpitesParticipante = {
          id: novoId,
          nome,
          email: novoEmail,
          criadoEm: new Date().toISOString(),
          palpites: {}
        };
        rows.forEach(r => {
          novo.palpites[r.jogo_id] = r.placar_a;
          novo.palpites[`${r.jogo_id}-b`] = r.placar_b;
        });
        this.participantes.set([novo, ...this.participantes()]);
      }

      // garante estado canônico lendo do backend (e também alimenta outros clientes via realtime)
      await this.loadParticipantes();
    } catch (err) {
      console.error('Erro ao salvar palpites:', err);
    }
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

          if (acertouExato) {
            pontos += 10;
            acertos += 1;
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
      )
      .map((r, i) => ({ pos: i + 1, ...r } as ClassificacaoUsuario & { pos: number }));
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
        // tenta recuperar do armazenamento local quando a tabela não existe
        const local = this.loadFromStorage();
        if (local) {
          this.participantes.set(local);

          // tenta enriquecer participantes locais com dados de `profiles` quando disponível
          try {
            const ids = local.map(p => p.id).filter(Boolean);
            const emails = local.map(p => (p.email || '').trim().toLowerCase()).filter(Boolean);
            const filters: any = {};
            if (ids.length > 0) filters.user_id = ids;
            // consulta profiles por user_id e email
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('user_id, email, full_name, first_name, last_name')
              .or(`${ids.length ? `user_id.in.(${ids.join(',')})` : ''}${ids.length && emails.length ? ',' : ''}${emails.length ? `email.in.(${emails.map(e=>`"${e}"`).join(',')})` : ''}`);

            if (Array.isArray(profilesData) && profilesData.length > 0) {
              const profileMapById = new Map(profilesData.map((pf: any) => [pf.user_id, pf]));
              const profileMapByEmail = new Map(profilesData.map((pf: any) => [ (pf.email || '').trim().toLowerCase(), pf ]));
              const updated = local.map(p => {
                let pf = profileMapById.get(p.id);
                if (!pf && p.email) pf = profileMapByEmail.get(p.email.trim().toLowerCase());
                if (pf) {
                  const candidate = (pf.full_name || [pf.first_name, pf.last_name].filter(Boolean).join(' ')).trim();
                  if (candidate) p.nome = candidate;
                }
                return p;
              });
              this.participantes.set(updated);
            }
          } catch (e) {
            console.debug('Falha ao enriquecer participantes locais com profiles:', e);
          }

          return;
        }
        this.participantes.set([]);
        return;
      }

      if (!Array.isArray(data)) {
        this.participantes.set([]);
        return;
      }

      const participantesMap = new Map<string, PalpitesParticipante>();

      data.forEach((row: PalpiteRegistro) => {
        const emailNorm = (row.email || '').trim().toLowerCase();
        const key = emailNorm || row.user_id;
        const existing: PalpitesParticipante = participantesMap.get(key) ?? {
          id: row.user_id,
          nome: row.user_name,
          email: emailNorm,
          criadoEm: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          palpites: {}
        };

        existing.palpites[row.jogo_id] = row.placar_a;
        existing.palpites[`${row.jogo_id}-b`] = row.placar_b;
        participantesMap.set(key, existing);
      });

      const participantesArray: PalpitesParticipante[] = Array.from(participantesMap.values());

      // tenta enriquecer participantes com nome completo vindo da tabela `profiles`
      try {
        const ids = participantesArray.map(p => p.id).filter(Boolean);
        if (ids.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, email, full_name, first_name, last_name')
            .in('user_id', ids);

          if (Array.isArray(profilesData)) {
            const profileMapById = new Map(profilesData.map((pf: any) => [pf.user_id, pf]));
            const profileMapByEmail = new Map(profilesData.map((pf: any) => [ (pf.email || '').trim().toLowerCase(), pf ]));
            participantesArray.forEach(p => {
              let pf = profileMapById.get(p.id);
              if (!pf && p.email) pf = profileMapByEmail.get(p.email.trim().toLowerCase());
              if (pf) {
                const candidate = (pf.full_name || [pf.first_name, pf.last_name].filter(Boolean).join(' ')).trim();
                if (candidate) {
                  p.nome = candidate;
                }
              }
            });
          }
        }
      } catch (e) {
        // não bloqueia caso a consulta a profiles falhe
        console.debug('Falha ao enriquecer participantes com profiles:', e);
      }

      this.participantes.set(participantesArray);
    } catch (error) {
      console.error('Erro inesperado ao carregar palpites:', error);
      const local = this.loadFromStorage();
      if (local) {
        this.participantes.set(local);
        return;
      }
      this.participantes.set([]);
    }
  }

  private loadFromStorage(): PalpitesParticipante[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PalpitesParticipante[];
      if (!Array.isArray(parsed)) return null;
      // normaliza emails e estrutura
      const normalized = parsed.map(p => ({
        ...p,
        email: (p.email || '').trim().toLowerCase(),
        palpites: p.palpites || {}
      }));
      return normalized;
    } catch (e) {
      console.debug('Falha ao ler palpites do localStorage:', e);
      return null;
    }
  }

  private saveToStorage(participantes: PalpitesParticipante[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(participantes));
    } catch (e) {
      console.debug('Falha ao gravar palpites no localStorage:', e);
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

  // Retorna o identificador de email (normalizado) do usuário atual ou o email anônimo gerado
  getCurrentUserEmail(): string {
    const user = this.authService.user();
    return (user?.email?.trim().toLowerCase()) || this.getAnonimoEmail();
  }
}
