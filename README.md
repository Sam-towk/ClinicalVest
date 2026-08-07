<div align="center">

<img src="frontend/public/favicon.svg" alt="Logo do Clinical Vest" width="64" height="64" />

# Clinical Vest

Sistema multi-tenant de gestão clínica — pacientes, prontuários, agendamentos, fila digital e encaminhamentos para clínicas e consultórios veterinários.

</div>

Clinical Vest é um SaaS enxuto para clínicas e consultórios veterinários que precisam gerenciar pacientes, consultas e encaminhamentos sem adotar um sistema hospitalar completo. Cada conta é um tenant isolado: todo registro pertence à clínica que o criou, e o acesso é validado no servidor a partir de um JWT assinado — nunca de um header enviado pelo cliente.

O sistema é um monorepo pequeno:

- **`backend/`** — API REST em Node.js (Express) + MongoDB (Mongoose)
- **`frontend/`** — SPA em React + TypeScript, construída com Vite e Tailwind CSS

> [!NOTE]
> **Sobre este projeto.** O Clinical Vest é um projeto de estudo, criado para consolidar na prática conceitos de Node.js, TypeScript, arquitetura de APIs REST e persistência com MongoDB vistos na faculdade — e para aplicar, no desenho das telas e fluxos (fila digital, agendamentos, encaminhamentos), conceitos de Interação Humano-Computador (IHC) trabalhados na disciplina. Não é um produto em produção nem se destina a uso clínico real.

## Funcionalidades

- **Pacientes** — cadastro central de pacientes humanos e animais (espécie, documento/tutor, contato)
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
backend/src/
├── modules/<modulo>/
│   ├── <modulo>.routes.js       # router Express + autenticacao
│   ├── <modulo>.controller.js   # tratamento de request/response
│   └── <modulo>.service(s).js   # regra de negocio, fala com o model
├── models/                      # um schema Mongoose por entidade
├── middlewares/                 # auth.middleware.js, errorHandler.js
├── config/db.js                 # conexao com o Mongo
├── app.js                       # montagem da app Express
└── server.js                    # ponto de entrada
```

No frontend, cada módulo (pacientes, prontuários, agendamentos, fila, encaminhamentos, médicos) é descrito de forma declarativa em [`frontend/src/config/modules.ts`](frontend/src/config/modules.ts) — campos, labels e opções de select — e renderizado por uma única `ModulePage` genérica, então adicionar um módulo raramente exige uma página nova.

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (recomendado) ou uma instância de MongoDB local/remota

### Rodando com Docker

```bash
# na raiz do repositorio
cp .env.example .env               # defina MONGO_ROOT_USER / MONGO_ROOT_PASSWORD
cp backend/.env.example backend/.env
```

Edite `backend/.env` e defina um `JWT_SECRET` forte (ex: `openssl rand -hex 32`), depois:

```bash
docker compose up --build
```

Isso sobe o MongoDB e a API do backend em `http://localhost:3000`. O `MONGO_URI` de `backend/.env` é sobrescrito dentro da rede do compose, para o backend alcançar o Mongo pelo serviço `db`.

<details>
<summary>Outros comandos úteis do Docker</summary>

```bash
docker compose up --build -d       # subir em segundo plano
docker compose logs -f backend     # acompanhar os logs do backend
docker compose down                # parar os containers, mantendo o volume do Mongo
docker compose down -v             # parar e apagar o volume do Mongo
docker compose build --no-cache backend
docker compose exec backend sh     # abrir um shell no container do backend
docker compose exec db mongosh saas_hospitalar
```

</details>

### Rodando manualmente

```bash
# backend
cd backend
cp .env.example .env               # defina MONGO_URI e JWT_SECRET
npm install
npm run dev                        # http://localhost:3000
```

```bash
# frontend, em outro terminal
cd frontend
cp .env.example .env               # VITE_API_URL aponta para o backend
npm install
npm run dev                        # http://localhost:5173
```

> [!IMPORTANT]
> No modo manual é preciso ter uma instância de MongoDB acessível — ajuste `MONGO_URI` em `backend/.env` caso o Mongo não esteja em `localhost:27017`.

Com os dois rodando, abra `http://localhost:5173`, registre uma conta de clínica e faça login.

## Configuração

| Variável | Onde | Descrição |
| --- | --- | --- |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` | `.env` na raiz | Credenciais usadas pelo `docker-compose.yml` para provisionar o MongoDB |
| `PORT` | `backend/.env` | Porta em que a API escuta (padrão `3000`) |
| `MONGO_URI` | `backend/.env` | String de conexão do MongoDB (modo manual) |
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

**Backend:** Express, Mongoose, JSON Web Tokens, bcryptjs, Helmet, express-rate-limit
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Radix UI
