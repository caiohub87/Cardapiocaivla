# 🍔 Cardápio Digital Multi-Hamburgueria — Setup

Projeto **100% independente** (sem ligação com o sistema de logística).
Stack: HTML/CSS/JS puro + Supabase + Vercel.

## Passo 1 — Criar o Supabase
1. Acesse https://supabase.com e crie um **novo projeto** (aba separada da logística).
2. No painel do projeto, vá em **SQL Editor** → New query.
3. Cole todo o conteúdo de [`supabase-setup.sql`](supabase-setup.sql) e rode.
   Isso cria todas as tabelas, índices, RLS e realtime.

## Passo 2 — Conectar o código ao Supabase
1. No Supabase: **Project Settings → API**.
2. Copie a **Project URL** e a **anon public key**.
3. Cole em [`js/supabase-config.js`](js/supabase-config.js):
   ```js
   const SUPABASE_URL  = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON = 'eyJhbGc...';
   ```

## Passo 3 — (opcional) Desativar confirmação de e-mail no dev
Para testar login sem confirmar e-mail:
**Authentication → Providers → Email → desmarque "Confirm email"**.

## Passo 4 — Rodar localmente
```
python -m http.server 3000 --directory .
```
Abra: http://localhost:3000/admin

> Obs: as rotas dinâmicas `/minha-loja` só funcionam no Vercel (via `vercel.json`).
> Local, acesse o cliente por `http://localhost:3000/cliente.html` e ajuste o slug na URL depois do deploy.

## Passo 5 — Deploy no Vercel
1. Suba a pasta para um repositório no **GitHub**.
2. Em https://vercel.com → **Add New Project** → importe o repo.
3. Framework preset: **Other** (é estático). Deploy.
4. O [`vercel.json`](vercel.json) já cuida das rotas:
   - `/` → landing
   - `/admin` → Painel Desenvolvedor
   - `/minha-loja` → cardápio do cliente (tema carrega pelo slug)

---

## O que já está pronto (Fase 1 — Fundação)
- ✅ Schema completo do banco + RLS (isolamento por hamburgueria)
- ✅ Sistema de temas dinâmico (cores/logo por loja via variáveis CSS)
- ✅ Painel Desenvolvedor: login, criar conta, criar/listar hamburguerias
- ✅ Página do cliente: carrega tema + exibe cardápio
- ✅ Roteamento Vercel (rotas dinâmicas por slug)

## Próximas fases
- **Fase 2** — Painel de gestão da loja: CRUD de categorias/produtos, upload de imagem
- **Fase 3** — Editor de temas (mudar cores/logo/fonte visualmente)
- **Fase 4** — Carrinho + checkout (cliente faz pedido)
- **Fase 5** — Fila de pedidos em tempo real no ADM
- **Fase 6** — Garçom (QR code + consulta)

## Estrutura
```
Hamburguer/
├── index.html            landing
├── cliente.html          cardápio público (tema por slug)
├── admin/index.html      Painel Desenvolvedor
├── supabase-setup.sql    schema + RLS
├── vercel.json           rotas dinâmicas
├── css/base.css          variáveis de tema + estilos
└── js/
    ├── supabase-config.js  conexão + slugDaURL()
    └── temas.js            carregar/aplicar tema
```
