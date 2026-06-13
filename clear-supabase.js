const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jtnihqjbkftpboxqanmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0bmlocWpia2Z0cGJveHFhbm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjkzMzgsImV4cCI6MjA5NjYwNTMzOH0.WQB7QT3UMaPhEiA_CDObnc8klaIPhe7AMPeAnnfc9rs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteAll(table) {
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('id').limit(1000);
    if (error) {
      throw new Error(`${table} select error: ${JSON.stringify(error)}`);
    }
    if (!data || data.length === 0) {
      return deleted;
    }
    const ids = data.map(row => row.id).filter(Boolean);
    if (ids.length === 0) {
      return deleted;
    }
    const { data: delData, error: delError } = await supabase.from(table).delete().in('id', ids).select('id');
    if (delError) {
      throw new Error(`${table} delete error: ${JSON.stringify(delError)}`);
    }
    deleted += ids.length;
  }
}

(async () => {
  try {
    const tables = ['palpites', 'resultados'];
    for (const table of tables) {
      const { data: before, error: beforeError } = await supabase.from(table).select('id').limit(1);
      if (beforeError) {
        throw new Error(`${table} pre-select error: ${JSON.stringify(beforeError)}`);
      }
      console.log(`${table} rows before delete:`, before?.length ?? 0);
      const totalDeleted = await deleteAll(table);
      console.log(`${table} deleted rows:`, totalDeleted);
      const { data: after, error: afterError } = await supabase.from(table).select('id').limit(1);
      if (afterError) {
        throw new Error(`${table} after-select error: ${JSON.stringify(afterError)}`);
      }
      console.log(`${table} rows after delete:`, after?.length ?? 0);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();