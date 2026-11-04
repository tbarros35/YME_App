# YME Portal — Plataforma Interna de Gestão de Membros

> **YME Portal** é uma Progressive Web App (PWA) e plataforma de backoffice mobile-first desenvolvida para gestão integrada de membros, relatórios e evolução de competências (**Avaliação SAD**), transações e saldos virtuais (**YME Wallet**), marcos cronológicos de carreira (**Minha Jornada**) e agenda institucional (**Calendário**).

---

## 🚀 Tecnologias Utilizadas

### Frontend (`/frontend`)
- **React 18 + Vite + TypeScript**
- **Tailwind CSS + Shadcn/UI Design System**
- **Lucide Icons** para iconografia moderna
- **Recharts** para gráficos multi-eixo de evolução temporal e radar de competências
- **TanStack React Query** para caching e sincronização de dados de servidor
- **Axios** com interceptores para renovação automática de tokens JWT (`refresh token`)
- **PWA Ready** (Web Manifest, Mobile Navigation bar e layout responsivo)

### Backend (`/backend`)
- **Node.js + Express + TypeScript**
- **Arquitetura em Camadas**: `Routes` ➔ `Controllers` ➔ `Services` ➔ `Prisma ORM`
- **PostgreSQL 16** com migrações e seed via **Prisma ORM**
- **Autenticação & Segurança**: JWT (Access Token de 15m + Refresh Token em HTTP-Only cookie de 7 dias), hashing com Bcrypt, Helmet, CORS, e limitação de taxa (Rate Limiting)
- **Controlo de Acessos por Função (RBAC)**: `MEMBER`, `DIRECTOR`, `ADMIN`

### DevOps & Containerização
- **Docker & Docker Compose**: PostgreSQL 16 Alpine, Backend Node.js API e Frontend NGINX (Reverse Proxy na porta 80).

---

## 🔑 Credenciais de Demonstração (Seed Data)

A base de dados inclui utilizadores de teste pré-configurados com histórico completo de avaliações SAD, transações e marcos:

| Perfil | Email Institucional | Palavra-passe | Cargo / Permissões |
|---|---|---|---|
| **Admin** | `admin@yme.pt` | `password123` | Presidente & Tech Lead (Acesso Total) |
| **Diretor** | `director@yme.pt` | `password123` | Diretor de Projetos (Acesso Backoffice) |
| **Membro** | `member@yme.pt` | `password123` | Consultor Sénior (Acesso Pessoal) |

*Nota: O ecrã de Login dispõe de botões de **Acesso Rápido** para alternar instantaneamente entre perfis.*

---

## 🛠️ Como Executar o Projeto

### Opção 1: Via Docker Compose (Recomendado)

1. Certifica-te de que o Docker Desktop está em execução.
2. Na raiz do projeto, executa:
```bash
docker compose up -d --build
```
3. Acede à aplicação no navegador:
   - **Frontend & App Web**: `http://localhost`
   - **Backend REST API**: `http://localhost:3001/api`
   - **Healthcheck**: `http://localhost:3001/health`

Para parar os contentores:
```bash
docker compose down
```

---

### Opção 2: Desenvolvimento Local (Node.js + PostgreSQL)

#### 1. Configurar o Backend
```bash
cd backend
cp .env.example .env
# Ajusta a DATABASE_URL no .env se necessário

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
O servidor Express estará disponível em `http://localhost:3001`.

#### 2. Configurar o Frontend
```bash
cd frontend
cp .env.example .env

npm install
npm run dev
```
A aplicação React/Vite estará disponível em `http://localhost:5173`.

---

## 📋 Endpoints da API REST

### Autenticação (`/api/auth`)
- `POST /api/auth/login` — Autenticação de utilizador (Email + Password)
- `POST /api/auth/refresh` — Rotação silenciosa de token de acesso
- `POST /api/auth/logout` — Invalidação de sessão e limpeza de cookie
- `GET /api/auth/me` — Obtenção do perfil autenticado e permissões

### Avaliação SAD (`/api/sad`)
- `GET /api/sad/my` — Histórico de avaliações do utilizador autenticado
- `GET /api/sad/user/:userId` — Consulta de avaliações de um membro *(Direção/Admin)*
- `POST /api/sad` — Registo de nova avaliação SAD com notas e feedback *(Direção/Admin)*

### Carteira YME (`/api/wallet`)
- `GET /api/wallet/balance` — Saldo calculado `SUM(amount)` + histórico paginado
- `GET /api/wallet/user/:userId` — Consulta da carteira de um membro *(Direção/Admin)*
- `POST /api/wallet/transaction` — Crédito/débito na conta de um membro *(Direção/Admin)*

### Linha do Tempo & Jornada (`/api/timeline`)
- `GET /api/timeline/my` — Lista cronológica de marcos e conquistas do membro
- `POST /api/timeline` — Adição de marco na jornada *(Direção/Admin)*

### Calendário & Atividades (`/api/calendar`)
- `GET /api/calendar` — Eventos futuros e passados com filtro por categoria/mês
- `POST /api/calendar` — Agendamento de novo evento associativo *(Direção/Admin)*
- `DELETE /api/calendar/:id` — Remoção de evento *(Direção/Admin)*

### Utilizadores & Backoffice (`/api/users`)
- `GET /api/users/dashboard` — Métricas consolidadas para o dashboard
- `GET /api/users` — Diretório e lista de membros para seleção *(Direção/Admin)*
- `GET /api/users/departments` — Lista de departamentos ativos

---

## 📱 Funcionalidades Principais da Interface (UI/UX)

1. **Ecrã de Login**:
   - Validação de email institucional `@yme.pt`.
   - Botões de acesso rápido com 1 clique para demonstração.
2. **Minha Jornada (Dashboard)**:
   - Cartões de resumo dinâmicos: Saldo YME Wallet, Última Nota SAD (/20), Próximo Evento e Total de Marcos.
   - Linha do tempo vertical interativa com filtros de categoria (Projetos, Formações, Prémios, Task Groups, Recrutamento).
3. **Avaliação SAD & Analytics**:
   - Gráfico multi-eixo Recharts com evolução temporal de Soft Skills, Hard Skills e Nota Final.
   - Gráfico Radar de equilíbrio de competências técnicas e interpessoais.
   - Detalhe por trimestre com barras de progresso, feedback da Direção e link para relatório PDF.
4. **YME Wallet**:
   - Cartão virtual holográfico com dados do titular, departamento e saldo disponível.
   - Indicadores de total ganho em prémios vs total utilizado em eventos.
   - Extrato de transações com cores diferenciadas e paginação.
5. **Calendário Associativo**:
   - Cartões detalhados com etiquetas de categoria, horário e localização.
   - Modal com detalhes e atalho direto para o Google Maps.
6. **Backoffice de Gestão**:
   - Área restrita para membros com perfil `DIRECTOR` ou `ADMIN`.
   - Abas dedicadas: Submeter SAD, Registar Movimento de Carteira, Adicionar Marco e Agendar Evento.
   - Tabela geral com o diretório de todos os membros e respetivos cargos.
