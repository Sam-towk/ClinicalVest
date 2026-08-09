<div align="center">

<img src="frontend/public/favicon.svg" alt="Logo do Clinical Vest" width="64" height="64" />

# Clinical Vest

Sistema multi-tenant de gestão clínica — pacientes, prontuários, agendamentos, fila digital e encaminhamentos para clínicas de atendimento humano.

</div>

Clinical Vest é um SaaS enxuto para clínicas e consultórios que precisam gerenciar pacientes, consultas e encaminhamentos sem adotar um sistema hospitalar completo. Não cobre veterinário/pets. Cada conta é um tenant isolado: todo registro pertence à clínica que o criou, e o acesso é validado no servidor a partir de um JWT assinado — nunca de um header enviado pelo cliente.

O sistema é um monorepo pequeno:

- **`backend/`** — API REST em Node.js (Express) + Supabase/Postgres (Prisma)
- **`frontend/`** — SPA em React + TypeScript, construída com Vite e Tailwind CSS

> [!NOTE]
> **Sobre este projeto.** O Clinical Vest é um projeto de estudo, criado para consolidar na prática conceitos de Node.js, TypeScript, arquitetura de APIs REST e persistência com Postgres vistos na faculdade — e para aplicar, no desenho das telas e fluxos (fila digital, agendamentos, encaminhamentos), conceitos de Interação Humano-Computador (IHC) trabalhados na disciplina. Não é um produto em produção nem se destina a uso clínico real.

## Funcionalidades

- **Pacientes** — cadastro de pacientes humanos (CPF, contato); ao criar, opção de já entrar na fila digital
- **Prontuários** — alergias, exames solicitados, itens prescritos e classificação da doença (CID)
- **Agendamentos** — marcação de consultas com acompanhamento de status (agendado, confirmado, em andamento, concluído, cancelado)
- **Fila digital** — substitui a retirada física de senha, com prioridade e status por paciente
- **Encaminhamento de medicamentos e procedimentos** — roteia solicitações para um setor de destino por nível de prioridade
- **Médicos** — cadastro do corpo clínico e suas especialidades
- **Autenticação** — login/registro via JWT, com tenant e role embutidos no token em vez de confiados a partir do cliente

> [!NOTE]
> Toda collection tem um `tenantId`. Todas as queries do backend filtram por ele, e o valor sempre vem do JWT do usuário autenticado — nunca de um header de requisição ou do frontend.

## Arquitetura

Cada módulo do backend segue a mesma camada `routes → controller → service → model`, uma pasta por domínio:

```
backend/
├── prisma/schema.prisma         # schema do banco (models, enums, indices)
├── src/
│   ├── modules/<modulo>/
│   │   ├── <modulo>.routes.js       # router Express + autenticacao
│   │   ├── <modulo>.controller.js   # tratamento de request/response
│   │   └── <modulo>.service(s).js   # regra de negocio, fala com o Prisma Client
│   ├── middlewares/              # auth.middleware.js, errorHandler.js
│   ├── config/prisma.js          # conexao com o Postgres (Supabase) via Prisma
│   ├── app.js                    # montagem da app Express
│   └── server.js                 # ponto de entrada
```

No frontend, cada módulo (pacientes, prontuários, agendamentos, fila, encaminhamentos, médicos) é descrito de forma declarativa em [`frontend/src/config/modules.ts`](frontend/src/config/modules.ts) — campos, labels e opções de select — e renderizado por uma única `ModulePage` genérica, então adicionar um módulo raramente exige uma página nova.

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- Um projeto [Supabase](https://supabase.com/) (gratuito) — crie um em supabase.com e pegue as connection strings em *Project Settings → Database → Connection string*
- [Docker](https://www.docker.com/) (opcional, só para rodar a API containerizada)

### Configurar o banco (Supabase)

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env` e defina:
- `DATABASE_URL` e `DIRECT_URL` — connection strings do seu projeto Supabase (veja os comentários em `.env.example`)
- `JWT_SECRET` — um valor aleatório forte (ex: `openssl rand -hex 32`)

Depois aplique o schema no banco (a migration `init` já vem no repo):

```bash
npm install
npm run migrate:deploy
```

### Rodando com Docker

Com `backend/.env` preenchido (URLs do **pooler** Supabase + `JWT_SECRET`):

```bash
docker compose up --build
```

Sobe só o backend em `http://localhost:3000`. No start o container roda `prisma migrate deploy` e depois a API. O Postgres fica no Supabase (não há serviço de banco no Compose).

<details>
<summary>Outros comandos úteis do Docker</summary>

```bash
docker compose up --build -d       # subir em segundo plano
docker compose logs -f backend     # acompanhar os logs do backend
docker compose down                # parar o container
docker compose build --no-cache backend
docker compose exec backend sh     # abrir um shell no container do backend
```

</details>

### Rodando manualmente

```bash
# backend (depois de configurar o banco, ver acima)
cd backend
npm run dev                        # http://localhost:3000
```

```bash
# frontend, em outro terminal
cd frontend
cp .env.example .env               # VITE_API_URL aponta para o backend
npm install
npm run dev                        # http://localhost:5173
```

Com os dois rodando, abra `http://localhost:5173`, registre uma conta de clínica e faça login.

## Configuração

| Variável | Onde | Descrição |
| --- | --- | --- |
| `PORT` | `backend/.env` | Porta em que a API escuta (padrão `3000`) |
| `DATABASE_URL` | `backend/.env` | Connection string do Postgres (Supabase) via connection pooler — usada em runtime |
| `DIRECT_URL` | `backend/.env` | Connection string direta do Postgres (Supabase) — usada só pelo Prisma CLI (`migrate`) |
| `JWT_SECRET` | `backend/.env` | Segredo usado para assinar os tokens de autenticação — obrigatório, sem valor padrão |
| `JWT_EXPIRES_IN` | `backend/.env` | Tempo de vida do token (padrão `8h`) |
| `CORS_ORIGIN` | `backend/.env` | Lista de origens autorizadas a chamar a API, separadas por vírgula |
| `VITE_API_URL` | `frontend/.env` | URL base usada pelo frontend para acessar a API |

## Visão geral da API

Todas as rotas ficam sob `/api` e, exceto `/api/auth/*`, exigem o header `Authorization: Bearer <token>`.

| Rota | Descrição |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | Cria um tenant/conta e retorna um JWT |
| `/api/patients` | Cadastro de pacientes |
| `/api/medical-records` | Prontuários |
| `/api/scheduling` | Agendamentos |
| `/api/queue` | Senhas da fila digital |
| `/api/medication-referrals` | Encaminhamentos de medicamentos |
| `/api/procedure-referrals` | Encaminhamentos de procedimentos |
| `/api/doctors` | Cadastro do corpo clínico |
| `GET /health` | Verificação de disponibilidade |

Login e registro têm um rate limit mais restrito (10 requisições / 15 min) que o resto da API (300 requisições / 15 min), para dificultar ataques de força bruta e enumeração de contas.

## Stack

**Backend:** Express, Prisma, Supabase (Postgres), JSON Web Tokens, bcryptjs, Helmet, express-rate-limit
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Radix UI
