# Almoxarifado

Sistema de controle de almoxarifado. Migrado do Base44 para **Supabase**
(banco de dados + autenticação) e hospedado na **Vercel**.

## Rodando localmente

1. Instale as dependências:
   ```
   npm install
   ```
2. Crie o arquivo `.env.local` (baseado no `.env.example`) com as chaves do seu projeto Supabase:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```
   Essas chaves ficam em Supabase Dashboard → Settings → API.
3. No SQL Editor do Supabase, rode o arquivo `supabase_schema.sql` deste
   repositório para criar as tabelas e as políticas de segurança (RLS).
4. Rode o app:
   ```
   npm run dev
   ```
5. Cadastre-se pela tela de login. Depois, torne seu usuário admin rodando
   no SQL Editor (trocando o e-mail):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'seu@email.com');
   ```

## Deploy na Vercel

1. Suba este repositório para o GitHub.
2. Na Vercel, importe o repositório (framework detectado: Vite).
3. Em Settings → Environment Variables, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com os mesmos valores do `.env.local`.
4. Em Supabase → Authentication → URL Configuration, adicione a URL da
   Vercel em Site URL e Redirect URLs.

## Estrutura

- `src/lib/supabaseClient.js` — cliente do Supabase (lê as variáveis de ambiente).
- `src/api/entities.js` — funções de CRUD (Item, Employee, StockMovement,
  PurchaseRequest, UserPermission) que conversam com as tabelas do Supabase.
- `src/lib/AuthContext.jsx` — autenticação (login, cadastro, sessão, papel do usuário).
- `src/pages/Login.jsx` — tela de login/cadastro.
- `supabase_schema.sql` — script para criar as tabelas e regras de segurança no Supabase.
