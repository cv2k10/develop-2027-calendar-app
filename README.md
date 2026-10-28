# Warm Planner · 2027 行事曆

A 2027 calendar and to-do planner with month, year and agenda views, categories, and `.ics` export. Built with Next.js 16 (App Router), Tailwind CSS 4 and Drizzle ORM. It runs on **Cloudflare Workers** through the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare), and stores its data in **Cloudflare D1**.

## Stack

| Layer    | Choice                                              |
| -------- | --------------------------------------------------- |
| Runtime  | Cloudflare Workers (`nodejs_compat`) via OpenNext   |
| Database | Cloudflare D1 (SQLite), binding `DB`                |
| ORM      | Drizzle (`drizzle-orm/d1`)                          |
| UI       | Next.js 16, React 19, Tailwind CSS 4                |

## Local development

```bash
npm install
npm run db:migrate:local   # creates the tables and loads the sample 2027 data in a local D1
npm run dev                # Next dev server with the D1 binding (http://localhost:3000)
npm run preview            # production build running on the Workers runtime (workerd)
```

## Deploy to Cloudflare

1. Log in: `npx wrangler login`
2. Create the database: `npx wrangler d1 create warm-planner-db`, then paste the printed `database_id` into `wrangler.jsonc`.
3. Apply migrations remotely: `npm run db:migrate:remote`
4. Deploy: `npm run deploy`

To deploy from Git, connect the repo in **Workers & Pages → Create → Import a repository** with build command `npx opennextjs-cloudflare build` and deploy command `npx opennextjs-cloudflare deploy`.

## Database changes

Edit `src/db/schema.ts`, run `npx drizzle-kit generate` to write a new SQL file into `migrations/`, then apply it with `npm run db:migrate:local` / `npm run db:migrate:remote`. After you change `wrangler.jsonc`, run `npm run cf-typegen` to regenerate the binding types.

## API

| Method   | Path               | Purpose                                     |
| -------- | ------------------ | ------------------------------------------- |
| `GET`    | `/api/events`      | List items (`?month=2027-03`, `?q=keyword`) |
| `POST`   | `/api/events`      | Create an item                              |
| `PATCH`  | `/api/events/:id`  | Update an item                              |
| `DELETE` | `/api/events/:id`  | Delete an item                              |
| `GET`    | `/api/export`      | Download every item as `.ics`               |
| `GET`    | `/api/health`      | Check the database connection               |
