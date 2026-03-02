# HD Events - Event Operations MVP

Modular event operations admin app built with Next.js 14 App Router, TypeScript, Prisma, and Tailwind CSS.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- SQLite (local development)
- Tailwind CSS
- `pdf-lib` for event closeout reports

## Architecture

```text
app/
components/
lib/
  db/
  utils/
  types/
modules/
  events/
  contacts/
  documents/
  marketing/
  automation/
prisma/
public/
  uploads/
  reports/
```

- Page files orchestrate UI + call module-layer functions.
- Business logic is in `modules/*`.
- Prisma access is centralized in `lib/db/prisma.ts`.

## Features Implemented
- Password-protected admin access via middleware (`APP_PASSWORD`)
- Dashboard:
  - List events
  - Create event
  - View event
  - Delete event
- Event detail:
  - Budget overview
  - Dynamic financials (`getEventFinancials(eventId)`)
  - Category-grouped item management
  - Item status dropdown updates
  - Attach/view/delete documents
  - Inline new contact creation while adding an item
  - Finish Event -> mark `FINISHED`, generate/save PDF report, trigger download
- Contacts:
  - List and filter by category
  - Edit and delete contacts
  - View associated past events
- Module placeholders:
  - `modules/marketing`
  - `modules/automation`

## Environment Variables
Create `.env` from `.env.example`:

```env
DATABASE_URL="file:./dev.db"
APP_PASSWORD="change-this-password"
```

## Local Run
1. Install dependencies:
```bash
npm install
```
2. Generate Prisma client:
```bash
npm run prisma:generate
```
3. Initialize DB schema:
```bash
npm run db:push
```
If `db:push` fails in your environment, use:
```bash
npm run db:init
```
4. Start dev server:
```bash
npm run dev
```
5. Open [http://localhost:3000](http://localhost:3000)

## Build Check
```bash
npm run build
```

## Vercel Free Tier Deployment
1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add environment variables in Vercel project settings:
   - `APP_PASSWORD`
   - `DATABASE_URL`
4. For Vercel Postgres migration later:
   - Change `prisma/schema.prisma` datasource provider from `sqlite` to `postgresql`.
   - Set `DATABASE_URL` to your Vercel Postgres connection string.
   - Run `prisma migrate deploy` during deployment.

## Storage Notes (Uploads/Reports)
- Local dev: files are written under `public/uploads` and `public/reports`.
- Vercel runtime: writes fallback to `/tmp/hdevents/*` to avoid hard assumptions about writable project filesystem.
- `/tmp` is ephemeral, so long-term persistence should be replaced with a durable storage adapter when needed.
