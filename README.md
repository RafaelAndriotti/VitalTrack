# 🏋️ VitalTrack
 
Aplicativo full-stack de saúde e fitness para registro de treinos, controle de dieta e hidratação diária — construído com **React Native (Expo)** no front-end e uma **API REST própria em Node.js/TypeScript** no back-end.
 
> Projeto desenvolvido inicialmente como trabalho acadêmico (curso de Análise e Desenvolvimento de Sistemas) e evoluído como projeto de portfólio.
 
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
 
---
 
## 📱 Sobre o Projeto
 
O VitalTrack é um app multiplataforma (iOS, Android e Web) para quem quer acompanhar sua rotina de treinos e alimentação em um único lugar. O usuário cria uma conta, registra seus treinos em tempo real (exercícios, séries, cargas e repetições), monta suas refeições a partir de uma biblioteca de alimentos com informações nutricionais e acompanha sua meta diária de água.
 
Todo o back-end — autenticação, regras de negócio e persistência — foi construído do zero em TypeScript, sem frameworks de "boilerplate" prontos, como forma de aprofundar o entendimento sobre APIs REST, autenticação com JWT e modelagem de banco de dados relacional.
 
## ✨ Funcionalidades
 
### 🔐 Autenticação
- Cadastro e login com e-mail e senha
- Senhas criptografadas com **bcrypt** (salt rounds = 12)
- Sessão persistida via **JWT** (7 dias de validade)
- Armazenamento seguro do token (`expo-secure-store` no mobile, `localStorage` no web)
### 🏋️ Treinos
- Início de um "treino em andamento" com registro de exercícios e séries em tempo real
- Biblioteca de exercícios reutilizável (global + personalizada por usuário)
- Edição inline de nomes de treino/exercício, marcação de série concluída e histórico de treinos finalizados
- Possibilidade de reabrir um treino já concluído para ajustes
### 🍎 Dieta
- Registro de refeições por horário, com cálculo automático de calorias, proteínas, carboidratos e gorduras
- Biblioteca de alimentos (global + personalizada) com porção de referência, usada para calcular proporcionalmente a quantidade consumida
- Resumo diário de macronutrientes com barras de progresso
### 💧 Hidratação
- Registro de consumo de água do dia com metas configuráveis
- Atalhos rápidos (+250ml / +500ml) e opção de quantidade customizada
- Atualização otimista de interface para resposta instantânea
## 🛠️ Stack Técnica
 
**Front-end (mobile + web)**
- React Native 0.86 + React 19
- Expo Router (navegação por arquivos, rotas protegidas por grupo de autenticação)
- TypeScript
- `expo-secure-store` para armazenamento seguro de sessão
- `lucide-react-native` para ícones
- Fontes Poppins via `@expo-google-fonts`
**Back-end**
- Node.js + Express + TypeScript (execução via `tsx`)
- Autenticação com `jsonwebtoken` + `bcryptjs`
- `SQLite` como banco de dados, acessado via `better-sqlite3` (prepared statements)
- `helmet` para headers de segurança e `express-rate-limit` nas rotas de autenticação
**Banco de Dados**
- SQLite (arquivo local, criado automaticamente a partir do schema no boot)
- 8 tabelas relacionadas (`users`, `workouts`, `exercises`, `exercise_sets`, `meals`, `meal_items`, `exercise_library`, `food_library`, `daily_water`)
- Índices em colunas de busca frequente e triggers para atualização automática de `updated_at`
## 📂 Estrutura do Projeto
 
```
VitalTrack/
├── src/
│   ├── app/                  # Rotas (Expo Router)
│   │   ├── (auth)/           # Login e cadastro
│   │   └── (tabs)/           # Treinos, Dieta, Perfil
│   ├── contexts/             # AuthContext (sessão do usuário)
│   ├── services/             # Camada de comunicação com a API
│   ├── constants/             # Tema (cores, tipografia, espaçamento) e config
│   └── types/                 # Tipos TypeScript compartilhados
└── server/
    └── src/
        ├── routes/            # auth, workouts, meals, water
        ├── middlewares/       # Autenticação JWT, rate limit, error handler
        └── config/
            └── db.ts          # Conexão SQLite (better-sqlite3)
    (schema em database/schema.sqlite.sql)
```
 
## 🔌 Principais Endpoints da API
 
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria uma nova conta |
| POST | `/api/auth/login` | Autentica e retorna um token JWT |
| GET / POST | `/api/workouts` | Lista ou cria treinos |
| POST | `/api/workouts/:id/exercises` | Adiciona exercício a um treino |
| POST | `/api/workouts/:id/exercises/:exerciseId/sets` | Adiciona série a um exercício |
| GET / POST | `/api/meals` | Lista ou cria refeições do dia |
| POST | `/api/meals/:id/items` | Adiciona alimento a uma refeição |
| GET / POST | `/api/water` | Consulta ou atualiza consumo de água do dia |
 
Todas as rotas (exceto `auth`) exigem o header `Authorization: Bearer <token>`.
 
## 🚀 Rodando o Projeto Localmente
 
### Pré-requisitos
- Node.js 18+
- Expo Go instalado no celular (opcional, para testar no dispositivo físico)
### 1. Clone o repositório
```bash
git clone https://github.com/RafaelAndriotti/VitalTrack.git
cd VitalTrack
```
 
### 2. Configure as variáveis de ambiente do back-end
```bash
cd server
cp .env.example .env
```
Preencha o `.env`:
```
JWT_SECRET=uma-string-longa-e-aleatoria
PORT=3001
# Opcional: caminho do arquivo SQLite (padrão server/data/vitaltrack.db)
# DATABASE_PATH=/var/lib/vitaltrack/vitaltrack.db
# Opcional: origens permitidas de CORS (separadas por vírgula)
# CORS_ORIGIN=https://meu-app.com
```
> ⚠️ O `.env` nunca deve ser commitado. Gere um `JWT_SECRET` forte, por exemplo com `openssl rand -base64 32`.
> O banco SQLite é criado automaticamente a partir de `database/schema.sqlite.sql` no primeiro boot — nenhum passo manual de banco é necessário.
 
### 4. Instale as dependências e rode o back-end
```bash
npm install
npm run dev
```
 
### 5. Instale as dependências e rode o app (em outro terminal, na raiz do projeto)
```bash
cd ..
npm install
npm start
```
Escaneie o QR Code com o app **Expo Go** ou pressione `w` para abrir no navegador.

> Por padrão o app aponta para `http://localhost:3001/api`. Para outro backend,
> defina `EXPO_PUBLIC_API_URL` (ex.: `EXPO_PUBLIC_API_URL=https://api.meu-app.com/api`).
> **Em produção use sempre `https`** — o token JWT e os dados do usuário trafegam nessa conexão.
 
## 🗺️ Possíveis Melhorias Futuras
 
- Metas de macronutrientes configuráveis por usuário (hoje são fixas)
- Testes automatizados (unitários e de integração)
- Paginação no histórico de treinos e refeições
## 👤 Autor
 
**Rafael Andriotti Rebelo**
[LinkedIn](https://linkedin.com/in/rafaelandriotti) · [GitHub](https://github.com/RafaelAndriotti)
