import { createClient } from '@supabase/supabase-js';

// Substitua pelos valores reais do seu projeto Supabase:
const SUPABASE_URL = 'https://jtnihqjbkftpboxqanmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0bmlocWpia2Z0cGJveHFhbm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjkzMzgsImV4cCI6MjA5NjYwNTMzOH0.WQB7QT3UMaPhEiA_CDObnc8klaIPhe7AMPeAnnfc9rs';

if (SUPABASE_URL.includes('seu-projeto') || SUPABASE_ANON_KEY.includes('sua-chave-anon-publica-aqui')) {
  console.warn('Supabase não está configurado. Substitua SUPABASE_URL e SUPABASE_ANON_KEY em src/app/supabase.client.ts pelos valores reais do seu projeto Supabase.');
}

// Usar `sessionStorage` isola a sessão por aba (cada aba tem seu próprio storage),
// evitando que um login em uma aba sobrescreva o da outra.
const storage = (typeof window !== 'undefined' && window.sessionStorage)
  ? window.sessionStorage
  : {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {},
      removeItem: (_key: string) => {},
    };

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage },
});
