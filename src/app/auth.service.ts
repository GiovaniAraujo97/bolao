import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from './supabase.client';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  firstName?: string;
  lastName?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  user_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly name = signal<string | null>(null);
  readonly loading = signal(false);
  readonly message = signal('');

  // Promise that resolves after the initial session restore completes.
  public ready: Promise<void>;
  private _resolveReady!: () => void;
  private readonly router = inject(Router);

  constructor() {
    this.ready = new Promise<void>((resolve) => {
      this._resolveReady = resolve;
    });

    if (typeof window !== 'undefined') {
      this.restoreSession().finally(() => this._resolveReady());
      supabase.auth.onAuthStateChange((event, session) => {
        console.debug('[AuthService] onAuthStateChange event:', event, session);
        this.restoreSession();
      });
    } else {
      this._resolveReady();
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      this.message.set('E-mail e senha são obrigatórios.');
      return false;
    }

    this.loading.set(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword
      });

      if (error) {
        const lowerMessage = (error.message || '').toLowerCase();
        if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('user not found') || lowerMessage.includes('email not found')) {
          this.message.set('Não encontramos sua conta. Se ainda não tiver cadastro, clique em Criar conta.');
        } else {
          this.message.set(error.message || 'Falha ao entrar. Verifique suas credenciais ou crie uma conta.');
        }
        return false;
      }

      await this.setUserFromSession(data.session?.user ?? null);
      this.message.set('Login realizado com sucesso.');
      return true;
    } catch (error) {
      this.message.set('Falha de rede ao conectar com Supabase. Verifique a URL e as configurações do projeto.');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async signup(fullName: string, email: string, password: string, phone?: string): Promise<boolean> {
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedPhone = phone?.trim();

    if (!normalizedFullName || !normalizedEmail || !normalizedPassword || (phone !== undefined && !normalizedPhone)) {
      this.message.set('Nome completo, e-mail, senha e telefone são obrigatórios.');
      return false;
    }

    const [firstName, ...rest] = normalizedFullName.split(' ').filter(Boolean);
    const lastName = rest.join(' ') || '';

    this.loading.set(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          data: {
            phone: normalizedPhone || '',
            first_name: firstName,
            last_name: lastName,
            full_name: normalizedFullName
          }
        }
      });

      if (error) {
        this.message.set(error.message || 'Falha ao cadastrar. Tente novamente.');
        return false;
      }

      if (!data.session?.user) {
        this.message.set('Conta criada. Verifique seu e-mail para confirmar antes de fazer login.');
        return true;
      }

      await this.setUserFromSession(data.session.user);
      this.message.set('Conta criada e você foi conectado. Bem-vindo!');
      return true;
    } catch (error) {
      this.message.set('Falha de rede ao conectar com Supabase. Verifique a URL e as configurações do projeto.');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.user.set(null);
    this.profile.set(null);
    this.message.set('Sessão encerrada.');
    try {
      if (typeof window !== 'undefined') {
        // força recarregamento completo para limpar estado residual
        window.location.replace('/login');
      }
    } catch (e) {
      // ignore
    }
  }

  isAuthenticated(): boolean {
    return this.user() !== null;
  }

  isAdmin(): boolean {
    return this.profile()?.role === 'admin' || this.user()?.email === 'admin@adega.com' || this.user()?.role === 'admin';
  }

  private async restoreSession(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    console.debug('[AuthService] restoreSession start');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      this.user.set(null);
      this.profile.set(null);
      console.debug('[AuthService] restoreSession error', error);
      return;
    }

    await this.setUserFromSession(data.session?.user ?? null);
    console.debug('[AuthService] restoreSession completed');
  }

  private async setUserFromSession(user: { id: string; email?: string | null; user_metadata?: any } | null): Promise<void> {
    if (!user || !user.email) {
      this.user.set(null);
      this.profile.set(null);
      return;
    }

    const role = user.user_metadata?.role === 'admin' ? 'admin' : 'user';
    const firstName = user.user_metadata?.first_name ?? user.user_metadata?.firstName ?? '';
    const lastName = user.user_metadata?.last_name ?? user.user_metadata?.lastName ?? '';
    this.user.set({
      id: user.id,
      email: user.email,
      role,
      firstName: firstName || undefined,
      lastName: lastName || undefined
    });
    this.name.set(this.deriveNameFromMetadata(user.user_metadata));

    await this.ensureProfile({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    });

    // Se estivermos na tela de login e acabamos de restaurar/efetuar login,
    // força a navegação para o destino correto para evitar inconsistências
    // onde o header mostra usuário mas o router-outlet ainda exibe login.
    try {
      if (typeof window !== 'undefined' && this.router && this.router.url === '/login') {
        this.router.navigate([this.isAdmin() ? '/admin' : '/dashboard']);
      }
    } catch (e) {
      console.debug('[AuthService] navegação pós-login falhou', e);
    }
  }

  private async ensureProfile(user: { id: string; email: string; user_metadata?: any }): Promise<void> {
    const existingProfile = await this.fetchProfile(user.id);
    if (existingProfile) {
      this.profile.set(existingProfile);
      const profileName = this.deriveNameFromProfile(existingProfile);
      const currentName = this.name();
      if (profileName && (!currentName || profileName.length > currentName.length)) {
        this.name.set(profileName);
      }
      return;
    }

    const phone = user.user_metadata?.phone ?? '';
    const role = user.user_metadata?.role === 'admin' ? 'admin' : 'user';
    const firstName = user.user_metadata?.first_name ?? user.user_metadata?.firstName ?? '';
    const lastName = user.user_metadata?.last_name ?? user.user_metadata?.lastName ?? '';
    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.fullName ?? '';

    if (!phone) {
      this.profile.set(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          phone,
          role,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error || !data) {
      this.profile.set(null);
      return;
    }

    this.profile.set(data as Profile);
  }

  private async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
    if (!data) {
      console.warn('Nenhum perfil encontrado para user_id:', userId);
      return null;
    }
    console.log('Perfil carregado:', {
      email: data.email,
      role: data.role,
      phone: data.phone,
      user_id: data.user_id,
      completo: data
    });
    const profile = data as Profile;
    console.log('Perfil carregado:', {
      email: profile.email,
      role: profile.role,
      phone: profile.phone,
      user_id: profile.user_id,
      completo: profile
    });
    const profileName = this.deriveNameFromProfile(profile);
    const currentName = this.name();
    if (profileName && (!currentName || profileName.length > currentName.length)) {
      this.name.set(profileName);
    }
    return profile;
  }

  private deriveNameFromMetadata(metadata: any): string | null {
    if (!metadata) {
      return null;
    }

    const fullName = metadata.full_name ?? metadata.fullName ?? metadata.name ?? '';
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const firstName = metadata.first_name ?? metadata.firstName ?? '';
    const lastName = metadata.last_name ?? metadata.lastName ?? '';
    const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (combined) {
      return combined;
    }

    return null;
  }

  private deriveNameFromProfile(profile: Profile | null): string | null {
    if (!profile) {
      return null;
    }

    const fullName = profile.full_name ?? profile.user_name ?? '';
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const combined = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    return combined || null;
  }

  displayName(): string | null {
    return this.name() || this.deriveNameFromProfile(this.profile()) || null;
  }

  displayNameLines(): string[] | null {
    const displayName = this.displayName();
    if (!displayName) {
      return null;
    }

    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 0) {
      return null;
    }

    const firstLine = parts.shift() ?? '';
    const secondLine = parts.length > 0 ? parts.join(' ') : null;
    return secondLine ? [firstLine, secondLine] : [firstLine];
  }
}
