# SpravujTym

Webová aplikace pro správu sportovních týmů. Projekt se skládá z React klienta a Node.js backendu postaveného na Expressu, MongoDB a TypeScriptu.

## Přehled

Systém je určený pro správu sportovní organizace a pokrývá zejména:

- správu uživatelů a rolí
- správu týmů, soupisek a lig
- plánování týmových událostí
- evidenci účasti hráčů na událostech
- publikaci oznámení a komentářů
- správu plateb
- přihlašování pomocí JWT autentizace
- odesílání e-mailů přes Resend

## Technologie

- Frontend: React, TypeScript, Vite, Mantine
- Backend: Node.js, Express, TypeScript
- Databáze: MongoDB + Mongoose
- Autentizace: JWT v HTTP-only cookie
- Testování backendu: Jest, Supertest, mongodb-memory-server

## Struktura projektu

```text
.
├── client/        # React frontend
├── server/        # Express backend
├── LLM/           # UML diagramy a podklady
├── package.json   # root skripty
└── README.md
```

## Hlavní moduly aplikace

### Backend

- `server/routes/` obsahuje definici REST endpointů
- `server/controllers/` obsahuje business logiku jednotlivých modulů
- `server/models/` obsahuje Mongoose modely
- `server/middleware/` řeší autentizaci, autorizaci a guard logiku
- `server/services/` obsahuje integrační služby, například mailer
- `server/tests/` obsahuje integrační testy backendu

### Frontend

- `client/src/pages/` hlavní stránky aplikace
- `client/src/components/` znovupoužitelné UI komponenty
- `client/src/context/` aplikační a autentizační context
- `client/src/utils/` API komunikace a pomocné utility
- `client/src/types/` sdílené klientské typy

## Požadavky

- Node.js 18+
- npm
- MongoDB databáze nebo přístup k MongoDB Atlas

## Instalace

Nainstalování všech závislostí:

```bash
npm run install-all
```

Případně ručně:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

## Konfigurace prostředí

Backend používá proměnné prostředí definované v `server/.env`.

Požadované proměnné:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
NODE_ENV=development
```

## Spuštění projektu

Spuštění frontendu i backendu v development režimu:

```bash
npm run dev
```

Root skript spouští:

- backend přes `npm run dev --prefix server`
- frontend přes `npm run dev --prefix client`

## Build

Build celého projektu:

```bash
npm run build
```

To provede:

- build backendu do `server/dist`
- build frontendu do `client/dist`

## Spuštění produkční verze

Po buildu:

```bash
npm start
```

Tento příkaz spouští backend z `server/dist/server.js`.

## Testování

Backend integrační testy:

```bash
npm --prefix server test
```

Sledovací režim:

```bash
npm --prefix server run test:watch
```

Testy používají:

- Jest
- Supertest
- mongodb-memory-server

Každý test běží nad izolovanou dočasnou databází a nepoužívá produkční MongoDB.

## API přehled

Aplikace obsahuje zejména tyto backend moduly:

- `/api/user`
- `/api/team-event`
- `/api/team`
- `/api/squad`
- `/api/league`
- `/api/venue`
- `/api/payment`
- `/api/announcement`
- `/api/comment`
- `/api/email`

## UML a dokumentace

Ve složce `LLM/` jsou uložené diagramy a další podklady k návrhu systému, například:

- use-case diagram
- sekvenční diagramy
- activity diagram
- konceptuální a implementační diagram tříd
- deployment diagram
- komponentový diagram
- stavový diagram

## Poznámky k architektuře

- Backend exportuje Express app zvlášť od spuštění listeneru, takže ji lze testovat přes Supertest.
- Autentizace využívá JWT uložené v cookie `authToken`.
- Autorizace je postavená nad rolemi admin, coach a player.
- MongoDB přístup je řešen přes Mongoose modely a reference mezi entitami.
