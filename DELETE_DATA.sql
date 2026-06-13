-- Delete all rows from palpites table
DELETE FROM public.palpites;

-- Delete all rows from resultados table
DELETE FROM public.resultados;

-- Verify deletion
SELECT COUNT(*) as palpites_count FROM public.palpites;
SELECT COUNT(*) as resultados_count FROM public.resultados;
