<div align="center">

<img src="frontend/public/favicon.svg" alt="Logo do Clinical Vest" width="64" height="64" />

# Clinical Vest

Sistema multi-tenant para clínicas e consultórios pequenos — atendimento centrado no paciente, fila por ordem de chegada e prontuário no perfil.

</div>

Clinical Vest é um SaaS enxuto para clínicas e consultórios que precisam gerenciar pacientes, consultas e encaminhamentos sem adotar um sistema hospitalar completo. Não cobre veterinário/pets. Cada conta é um tenant isolado: todo registro pertence à clínica que o criou, e o acesso é validado no servidor a partir de um JWT assinado — nunca de um header enviado pelo cliente.

O sistema é um monorepo pequeno:

- **`backend/`** — API REST em Node.js (Express) + Postgres (Prisma)
- **`frontend/`** — SPA em React + TypeScript, construída com Vite e Tailwind CSS
- **`docker-compose.yml`** — Postgres local + API containerizada (caminho recomendado no dia a dia)

> [!NOTE]
> **Sobre este projeto.** O Clinical Vest é um projeto de estudo, criado para consolidar na prática conceitos de Node.js, TypeScript, arquitetura de APIs REST e persistência com Postgres vistos na faculdade — e para aplicar, no desenho das telas e fluxos (fila digital, agendamentos, encaminhamentos), conceitos de Interação Humano-Computador (IHC) trabalhados na disciplina. Não é um produto em produção nem se destina a uso clínico real.

## Funcionalidades

- **Consulta (médico)** — tela de atendimento com rascunho automático, anexos (exame, receita, atestado, encaminhamento) e contexto clínico lateral
- **Pacientes** — cadastro + perfil com abas (resumo, consultas, prescrições, exames, documentos); assistente não vê conteúdo clínico
- **Agendamentos** — agenda vinculada a paciente; check-in (`na_fila`) entra na fila do dia
- **Fila digital** — ordem de chegada (sem prioridade por gravidade); recepção encaminha ao médico
- **Médicos / usuários** — cadastro do corpo clínico e contas (admin)
- **Autenticação** — login/registro via JWT, com tenant e role embutidos no token

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
│   ├── config/prisma.js          # conexao com o Postgres via Prisma
│   ├── app.js                    # montagem da app Express
│   └── server.js                 # ponto de entrada
```

No frontend, os CRUDs de admin/recepção (pacientes, agendamentos, médicos, usuários) são descritos em [`frontend/src/config/modules.ts`](frontend/src/config/modules.ts) e renderizados pela `ModulePage` genérica. Telas de fluxo clínico — atendimento, perfil do paciente e fila do dia — são páginas próprias (`AtendimentoPage`, `PatientProfilePage`, `QueueDayPage`).

## Como rodar localmente

Caminho recomendado: **Docker sobe Postgres + backend**; o **frontend** roda com Vite na máquina.

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose)
- [Node.js](https://nodejs.org/) 20+ (só para o frontend)

### 1. Configurar o backend

Na raiz do repositório:

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env` e defina pelo menos:

```env
JWT_SECRET=troque-por-um-segredo-forte
CORS_ORIGIN=http://localhost:5173
```

Gere um segredo com:

```bash
openssl rand -hex 32
```

> Com Docker, o Compose **sobrescreve** `DATABASE_URL` e `DIRECT_URL` para apontar ao Postgres do container (`db`). Você pode deixar as URLs do `.env.example` como estão — elas não são usadas nesse modo.

### 2. Subir Postgres + API com Docker

Na **raiz** do repositório (`ClinicalVest/`):

```bash
docker compose up --build
```

Isso sobe dois serviços:

| Serviço | Container | Porta | Função |
| --- | --- | --- | --- |
| `db` | `clinicalvest-db` | `5432` | Postgres 16 local |
| `backend` | `clinicalvest-backend` | `3000` | API Express |

No start do container o backend executa, nesta ordem:

1. `prisma migrate deploy` — aplica as migrations
2. `scripts/seed-admin.js` — cria o usuário de teste (se ainda não existir)
3. `node src/server.js` — sobe a API

Confira se a API respondeu:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

**Login de teste** (criado pelo seed):

| Campo | Valor |
| --- | --- |
| E-mail | `admin@admin` |
| Senha | `admin` |

<details>
<summary>Comandos úteis do Docker</summary>

```bash
# subir em segundo plano
docker compose up --build -d

# acompanhar logs do backend
docker compose logs -f backend

# ver status dos containers
docker compose ps

# parar (mantém o volume do Postgres)
docker compose down

# parar e apagar o banco local
docker compose down -v

# rebuild sem cache
docker compose build --no-cache backend

# shell dentro do container da API
docker compose exec backend sh
```

</details>

### 3. Subir o frontend

Em **outro terminal**:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

O `.env` do frontend já aponta para a API local:

```env
VITE_API_URL=http://localhost:3000/api
```

Abra [http://localhost:5173](http://localhost:5173) e entre com `admin@admin` / `admin`, ou registre uma nova clínica.

### Checklist rápido

1. Docker Desktop ligado  
2. `backend/.env` com `JWT_SECRET` preenchido  
3. `docker compose up --build` na raiz → API em `http://localhost:3000`  
4. `npm run dev` em `frontend/` → app em `http://localhost:5173`  
5. Login com o seed ou registro de nova conta  

---

### Alternativa: backend sem Docker (Node local)

Use quando quiser desenvolver a API com `nodemon`, ainda com o Postgres do Compose:

```bash
# só o banco
docker compose up -d db

# no backend/.env, aponte para o Postgres publicado na máquina:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clinicalvest
# DIRECT_URL=postgresql://postgres:postgres@localhost:5432/clinicalvest

cd backend
npm install
npm run migrate:deploy
npm run seed:admin   # opcional — admin@admin / admin
npm run dev          # http://localhost:3000
```

### Alternativa: Supabase em vez do Postgres do Compose

O Compose, por padrão, força o banco local. Para usar Supabase:

1. Preencha `DATABASE_URL` (pooler, porta `6543`) e `DIRECT_URL` (session pooler, porta `5432`) em `backend/.env` — veja os comentários em `.env.example`
2. Em `docker-compose.yml`, remova do serviço `backend` o bloco `environment` que redefine `DATABASE_URL` / `DIRECT_URL` (ou comente essas duas linhas)
3. Opcionalmente remova o serviço `db` se não for mais necessário
4. Suba de novo: `docker compose up --build`

## Configuração

| Variável | Onde | Descrição |
| --- | --- | --- |
| `PORT` | `backend/.env` | Porta em que a API escuta (padrão `3000`) |
| `DATABASE_URL` | `backend/.env` | Connection string do Postgres em runtime (no Docker Compose é sobrescrita para o serviço `db`) |
| `DIRECT_URL` | `backend/.env` | Connection string usada pelo Prisma CLI (`migrate`) |
| `JWT_SECRET` | `backend/.env` | Segredo para assinar JWTs — obrigatório, sem valor padrão |
| `JWT_EXPIRES_IN` | `backend/.env` | Tempo de vida do token (padrão `8h`) |
| `CORS_ORIGIN` | `backend/.env` | Origens autorizadas, separadas por vírgula (padrão `http://localhost:5173`) |
| `VITE_API_URL` | `frontend/.env` | URL base da API usada pelo frontend |

## Visão geral da API

Todas as rotas ficam sob `/api` e, exceto `/api/auth/*`, exigem o header `Authorization: Bearer <token>`.

| Rota | Descrição |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | Cria um tenant/conta e retorna um JWT |
| `/api/patients` | Cadastro; `GET /search`, `GET /:id/summary` |
| `/api/consultations` | Consulta atual, finish/pause, anexos clínicos |
| `/api/scheduling` | Agendamentos |
| `/api/queue` | Fila do dia; `POST /:id/encaminhar`, `POST /reorder` |
| `/api/doctors` | Cadastro do corpo clínico |
| `/api/users` | Contas de usuário |
| `/api/dashboard` | Resumo admin |
| `GET /health` | Verificação de disponibilidade |

Login e registro têm um rate limit mais restrito (10 requisições / 15 min) que o resto da API (300 requisições / 15 min), para dificultar ataques de força bruta e enumeração de contas.

## Stack

**Backend:** Express, Prisma, PostgreSQL (Docker local ou Supabase), JSON Web Tokens, bcryptjs, Helmet, express-rate-limit  
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Radix UI  
**Infra local:** Docker Compose (Postgres 16 + API Node 20)
