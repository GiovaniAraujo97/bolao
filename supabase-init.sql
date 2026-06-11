-- Supabase table and policy setup for bolao-adega
-- Execute este script no editor SQL do Supabase para criar a tabela de perfis e as policies.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null,
  phone text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Usuário vê próprio perfil' AND polrelid = 'profiles'::regclass
  ) THEN
    CREATE POLICY "Usuário vê próprio perfil"
      ON profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Usuário cria próprio perfil' AND polrelid = 'profiles'::regclass
  ) THEN
    CREATE POLICY "Usuário cria próprio perfil"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id AND role = 'user');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Usuário atualiza próprio perfil' AND polrelid = 'profiles'::regclass
  ) THEN
    CREATE POLICY "Usuário atualiza próprio perfil"
      ON profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Usuário exclui próprio perfil' AND polrelid = 'profiles'::regclass
  ) THEN
    CREATE POLICY "Usuário exclui próprio perfil"
      ON profiles FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

create table if not exists palpites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  user_name text not null,
  jogo_id text not null,
  placar_a int not null,
  placar_b int not null,
  rodada_numero int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists palpites_user_jogo_unique on palpites(user_id, jogo_id);

alter table palpites enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Usuário insere palpite próprio' AND polrelid = 'palpites'::regclass
  ) THEN
    CREATE POLICY "Usuário insere palpite próprio"
      ON palpites FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        OR user_id LIKE 'anonimo-%'
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Usuário atualiza palpite próprio' AND polrelid = 'palpites'::regclass
  ) THEN
    CREATE POLICY "Usuário atualiza palpite próprio"
      ON palpites FOR UPDATE
      USING (
        auth.uid() = user_id
        OR user_id LIKE 'anonimo-%'
      )
      WITH CHECK (
        auth.uid() = user_id
        OR user_id LIKE 'anonimo-%'
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Qualquer usuário seleciona palpites' AND polrelid = 'palpites'::regclass
  ) THEN
    CREATE POLICY "Qualquer usuário seleciona palpites"
      ON palpites FOR SELECT
      USING (true);
  END IF;
END$$;
