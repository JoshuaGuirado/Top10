#!/bin/sh
# Roda o supabase/schema.sql num Postgres de verdade (duas vezes: precisa poder rodar de novo) e testa os jogos e as
# ligas. Precisa do psql e de um Postgres vazio: PGHOST, PGPORT, PGUSER (superusuário) e PGDATABASE no ambiente.
# No GitHub roda sozinho (.github/workflows/testes.yml). Uso: sh tests/banco.sh
set -e
cd "$(dirname "$0")/.."
psql() { command psql -X -q -v ON_ERROR_STOP=1 "$@"; }
psql -f tests/banco/supabase.sql
for vez in 1 2; do
  saida=$(psql -f supabase/schema.sql 2>&1) || { echo "$saida" | grep -v NOTICE; echo "ERRO: schema.sql (vez $vez)"; exit 1; }
done
echo "ok - schema.sql roda duas vezes"
saida=$(psql -f tests/banco/jogos.sql 2>&1) || { echo "$saida"; echo "ERRO: jogos"; exit 1; }
echo "$saida" | grep -v "^$" | sed 's/.*NOTICE: *//'
saida=$(psql -f tests/banco/ligas.sql 2>&1)
echo "$saida" | grep -q "1 | Ana  |    150 |        2" || { echo "$saida"; echo "ERRO: ranking da liga"; exit 1; }
echo "$saida" | grep -q "Você não está nessa liga" || { echo "$saida"; echo "ERRO: quem está fora viu a liga"; exit 1; }
echo "$saida" | grep -A2 "ligas_restantes" | grep -q " 0$" || { echo "$saida"; echo "ERRO: a liga vazia não sumiu"; exit 1; }
echo "ok - ligas: ranking da semana, quem está fora não vê e a liga vazia some"
echo "Banco: tudo certo"
