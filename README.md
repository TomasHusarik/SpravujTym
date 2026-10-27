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

## Testovací data (seed)

Pro vývoj a demo lze databázi naplnit realistickými **smyšlenými** daty: 6 celků (muži A/B, junioři, dorost, starší a mladší žáci), trenéři, hráči s pozicemi a čísly dresů, tréninky a zápasy 6 týdnů zpět a 8 týdnů dopředu, účasti, komentáře, oznámení a platby. Data se generují relativně k aktuálnímu datu a jsou při každém spuštění stejná.

```bash
npm run seed       # naplní PRÁZDNOU databázi z MONGO_URI
npm run db:reset   # smaže databázi vytvořenou seedem a naplní ji znovu
```

Pojistky:

- skript nikdy neběží s `NODE_ENV=production`,
- do neprázdné databáze bez `--reset` nic nezapíše,
- `--reset` smaže jen databázi, kterou vytvořil seed (značka v kolekci `seedmeta`); jinou databázi smaže jen s `npm run db:reset -- --force`.

Seed používá doménu `spravujtym.test` a mailer na tyto adresy e-maily neodesílá.

### Testovací přihlášení

Heslo pro všechny seedované účty: `Test1234!` (jen testovací hodnota).

| Role | E-mail | Poznámka |
|---|---|---|
| Admin | `admin@spravujtym.test` | správa všeho |
| Trenér | `trener@spravujtym.test` | trenér Muži A a Junioři |
| Trenér mládeže | `trener.mladez@spravujtym.test` | trenérka starších a mladších žáků |
| Hráč | `hrac@spravujtym.test` | hráč Muži A, má nezodpovězené události a platby |
| Nový uživatel | `novacek@spravujtym.test` | první přihlášení – vyplnění profilu |

## Upozornění a připomínky

- Upozornění v aplikaci (zvoneček v hlavičce) se ukládají do kolekce `notifications` a mažou se po 90 dnech.
- Důležité změny (zrušení, změna času/místa, obnovení, smazání, nominace na zápas, připomínky) chodí i e-mailem; uživatel to může vypnout v profilu.
- E-maily se posílají postupně na pozadí (limit Resend ~2/s). Odkaz „Otevřít v aplikaci“ v e-mailu vyžaduje proměnnou `APP_URL` (např. `https://spravujtym.cz`).
- Hráčům bez odpovědi přijde automatická připomínka 24 hodin před akcí; trenér může poslat připomínku ručně z detailu události (nejvýše jednou za hodinu).
- Připomínky spouští plánovač uvnitř serveru (každých 15 minut). Na Azure App Service musí být zapnuté **Always On**, jinak aplikace bez provozu usne a připomínky se neodešlou.

## Spuštění projektu

Spuštění frontendu i backendu v development režimu:

```bash
npm run dev
```

Root skript spouští:

- backend přes `npm run dev --prefix server`
- frontend přes `npm run dev --prefix client`

Vývojový server Vite přeposílá požadavky na `/api` na backend (`http://localhost:8000`, lze změnit proměnnou `API_PROXY_TARGET`). V `client/.env` proto stačí relativní `VITE_API_BASE_URL=/api` (viz `client/.env.example`).

Pro testování z telefonu nebo jiného počítače ve stejné síti:

```bash
npm run dev -- --host
```

nebo zkráceně `npm run dev:host`. Vite vypíše adresu `Network: http://<IP>:5173/`, kterou otevřete na druhém zařízení. Další parametry (např. `--port 5180`) se předají Vite stejným způsobem.

Frontend je ve vývojovém režimu dostupný i z jiných zařízení v místní síti. V terminálu Vite vypíše adresu `Network`; použijte ji například z telefonu nebo jiného počítače:

```text
http://<IP-adresa-počítače>:5173
```

Požadavky na `/api` Vite předává lokálnímu backendu na portu `8000`. Pokud port `5173` už používá jiný proces, Vite zvolí další volný port a je potřeba použít port uvedený v jeho výpisu. Zařízení musí být ve stejné síti a firewall musí povolit příslušný port.

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
