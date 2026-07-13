# 🍔 Cardápio Digital Multi-Hamburgueria

Plataforma **100% independente** para gerenciar cardápios digitais de múltiplas hamburgerias. Cada loja tem seu próprio estilo visual, URL e painel de administração — tudo em um único código.

## ✨ Características

- **N Hamburguerias** — sem limite de lojas, cada uma com identidade visual própria
- **Temas Dinâmicos** — customizar cores, logo e fonte por loja em tempo real
- **3 Canais de Vendas:**
  - 🌐 **Cardápio Digital** — visualização web com tema personalizado
  - 📱 **Site Local** — pedidos online caem direto no painel do ADM
  - 👨‍💼 **Garçom** — consulta de cardápio via QR code (sem autenticação)
- **Painel Desenvolvedor Centralizado** — criar/editar todas as lojas em um lugar
- **RLS Integrado** — dados de cada loja isolados automaticamente no banco
- **Offline-First** — cache em localStorage, sincroniza ao conectar
- **Sem Backend** — serverless via Supabase Functions (opcional)

## 🚀 Stack

- **Frontend:** HTML5 + CSS3 (variáveis dinâmicas) + JavaScript vanilla
- **Backend:** Supabase (PostgreSQL + RLS + Realtime)
- **Hospedagem:** Vercel (com rotas dinâmicas)
- **Autenticação:** Supabase Auth (OAuth2 / Magic Link)

## 📂 Estrutura

```
Hamburguer/
├── index.html              # Landing page
├── admin/index.html        # Painel Desenvolvedor (login + criar lojas)
├── cliente.html            # Cardápio público (carrega tema por URL)
├── checkout.html           # Checkout e pagamento (TODO: Fase 4)
├── garcom.html             # Consulta de cardápio (TODO: Fase 5)
├── supabase-setup.sql      # Schema completo do banco (execute no Supabase)
├── vercel.json             # Configuração de rotas dinâmicas
├── SETUP.md                # Passo a passo para iniciar
├── css/
│   └── base.css            # Temas + componentes reutilizáveis
└── js/
    ├── supabase-config.js  # Conexão Supabase
    └── temas.js            # Sistema de temas dinâmicos
```

## 🏃 Quick Start

### 1. Supabase
```bash
# 1. Crie um projeto em https://supabase.com
# 2. No SQL Editor, rode o arquivo:
# supabase-setup.sql
```

### 2. Config
Edite `js/supabase-config.js` com suas credenciais:
```javascript
const SUPABASE_URL  = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON = 'sua-chave-anonima-aqui';
```

### 3. Rodar Localmente
```bash
python -m http.server 3000 --directory .
# Abra: http://localhost:3000/admin
```

### 4. Deploy
```bash
# 1. Push para GitHub
git push

# 2. Conecte no Vercel
# Vercel automaticamente usa vercel.json para rotas

# 3. Acesse https://seu-dominio.vercel.app/admin
```

## 📋 Banco de Dados

### Tabelas Principais
- `hamburguerias` — cada loja (nome, slug, owner)
- `temas` — customização visual (cores, logo, fonte)
- `categorias` — grupos de produtos (ex: Hambúrgueres, Bebidas)
- `produtos` — itens do cardápio (nome, preço, imagem)
- `variantes` — opções (ex: tamanho P/M/G)
- `aditivos` — adicionais (ex: bacon extra)
- `pedidos` — vendas online
- `itens_pedido` — produtos de cada pedido
- `usuarios_hamburgueria` — owner/admin/garçom de cada loja
- `sessoes_garcom` — códigos de acesso do garçom

### Segurança (RLS)
- Catálogo: **leitura pública** (cliente vê o menu)
- Escrita: **apenas donos da loja** (via tabela `usuarios_hamburgueria`)
- Pedidos: **qualquer um cria**, **owner lê/edita**
- Isolamento automático: coluna `hamburgueria_id` em todas as tabelas

## 🎨 Sistema de Temas

Cada loja pode customizar:
- **Cor Primária** — destacar elementos (default: `#D4AF37` ouro)
- **Cor Secundária** — destaque alternativo (default: `#000000` preto)
- **Cor de Fundo** — tema geral (default: `#1a1a1a` escuro)
- **Cor de Texto** — legibilidade (default: `#ffffff` branco)
- **Logo** — imagem no topo
- **Fontes** — tipografia custom

Temas são salvos em **tempo real** e aplicados via **variáveis CSS dinâmicas** (`js/temas.js`).

## 🔐 Autenticação

### Painel Desenvolvedor
- Login com e-mail + senha (Supabase Auth)
- Criar conta automático
- Magic Link opcional (sem senha)

### Cliente (Site Local)
- Opcional: login pra histórico de pedidos
- Anônimo: fazer pedido sem criar conta

### Garçom
- Sem autenticação: usa código de 4 dígitos gerado pelo ADM
- Sincroniza offline

## 📱 Rotas (Vercel)

```
GET  /                       → Landing page
POST /admin                  → Painel Desenvolvedor
GET  /:slug                  → Cardápio da loja
GET  /:slug/checkout         → Checkout
GET  /garcom/:session_code   → Consulta garçom
```

Exemplo:
- `https://cardapio.vercel.app/burger-do-ze` → cardápio da loja "burger-do-ze"
- `https://cardapio.vercel.app/admin` → gerenciar todas as lojas

## 🗓️ Roadmap

### Fase 1 ✅ Fundação
- ✅ Schema Supabase completo
- ✅ Painel Desenvolvedor (login, criar/listar lojas)
- ✅ Página cliente (tema dinâmico)
- ✅ Sistema de temas
- ✅ RLS

### Fase 2 (em desenvolvimento)
- [ ] CRUD de categorias
- [ ] CRUD de produtos
- [ ] Upload de imagens (Supabase Storage)
- [ ] Reordenação (drag-and-drop)

### Fase 3
- [ ] Editor visual de temas
- [ ] Horários de funcionamento
- [ ] Métodos de pagamento

### Fase 4
- [ ] Carrinho persistente
- [ ] Checkout com email
- [ ] Integração Stripe/Mercado Pago

### Fase 5
- [ ] Fila de pedidos (Kanban)
- [ ] Dashboard (vendas, top produtos)
- [ ] Toggle de disponibilidade em tempo real

### Fase 6
- [ ] Garçom (QR code + consulta)
- [ ] Sincronização offline

### Pós-MVP
- [ ] App mobile (React Native)
- [ ] Impressora térmica
- [ ] WhatsApp API
- [ ] IA: recomendação de produtos

## 🛠️ Tech Stack Detalhado

| Camada | Ferramenta |
|--------|-----------|
| Frontend | HTML5, CSS3, JS vanilla |
| CSS Dinâmico | Variáveis CSS (`--cor-primaria`, etc) |
| Banco | PostgreSQL (Supabase) |
| Autenticação | Supabase Auth |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage (imagens) |
| Hospedagem | Vercel |
| Repositório | GitHub |

## 📚 Documentação

- [`SETUP.md`](SETUP.md) — guia de inicialização
- [`supabase-setup.sql`](supabase-setup.sql) — schema comentado
- [`vercel.json`](vercel.json) — configuração de rotas

## 🤝 Contribuindo

Este é um projeto pessoal. Para sugestões ou bugs:
1. Abra uma issue no GitHub
2. Descreva a feature/bug
3. Faça um PR

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para hamburguerias modernas.**

Dúvidas? Confira o [`SETUP.md`](SETUP.md) ou abra uma issue.
