# Configurar o modo online (Supabase)

Leva uns 10 minutos e é gratuito. Os nomes dos menus podem mudar um pouco no painel do Supabase, mas os passos são estes.

## 1. Criar o projeto
1. Entre em [supabase.com](https://supabase.com) e crie um projeto (plano Free).
2. Região: **South America (São Paulo)**, para o jogo ficar rápido no Brasil.
3. Guarde a senha do banco (não vai no site, só serve para você).

## 2. Criar as tabelas
1. No menu, **SQL Editor → New query**.
2. Cole todo o conteúdo de [`schema.sql`](schema.sql) e clique em **Run**.
3. Deve aparecer "Success". Pode rodar de novo sem problema se precisar.

Isso cria `profiles` (perfis), `rooms` (salas), `room_players` (quem está em cada sala) e `matches` (histórico), já com as regras de segurança (RLS).

## 3. Ligar o login
1. **Authentication → Sign In / Providers**: ative **Allow anonymous sign-ins**. É o que deixa todo mundo jogar sem criar conta.
2. O provedor **Email** já vem ligado. É ele que manda o link de "Conectar conta" (sem senha).
3. **Authentication → URL Configuration**:
   - **Site URL**: `https://joshuaguirado.github.io/Top10/`
   - **Redirect URLs**: adicione o mesmo endereço (e `http://localhost:8000/**` se for testar no computador).

## 4. Colocar as chaves no site
1. **Project Settings → API** (ou **API Keys**): copie a **Project URL** e a chave **anon public** (ou **publishable**).
2. Cole em [`js/config.js`](../js/config.js):
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
3. Envie para a `main`. Essa chave é pública de propósito: quem protege os dados são as regras do `schema.sql`. **Nunca** coloque a chave `service_role` (ou `secret`) no site.

## 5. Testar
Abra o site publicado em dois celulares (ou numa aba normal e numa anônima), toque em **Jogar online**, crie a sala num e entre com o código no outro.

## Como o online funciona
- Cada um joga no próprio celular. Quem cria a sala é o anfitrião: o celular dele roda a partida e manda o placar ao vivo para os outros (Realtime do Supabase).
- Quem cai ou recarrega a página volta sozinho para a sala. Se o anfitrião cair, a partida espera ele voltar; quem some na própria vez perde a vez depois de alguns segundos.
- Ninguém precisa de conta para jogar (login anônimo). **Conectar conta** (com e-mail, sem senha) guarda nickname, skin, estatísticas, recordes, lista do dia e listas criadas, e permite entrar em outro celular com o mesmo perfil.

## Limites do plano grátis (para ficar de olho)
- Realtime: algumas centenas de pessoas conectadas ao mesmo tempo. Sobra para turma, família e escola.
- E-mail: o servidor de e-mail padrão do Supabase tem um limite baixo de envios por hora. Se muita gente for conectar conta, configure um SMTP próprio (por exemplo o Resend, que tem plano grátis) em **Authentication → Emails → SMTP Settings**.
- Projeto grátis parado por uma semana é pausado. É só entrar no painel e reativar.
- Salas paradas há mais de um dia são apagadas sozinhas quando alguém cria uma sala nova.
