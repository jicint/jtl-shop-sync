# JTL to Shopify Catalog Sync Demo

This project shows how JTL product data can be turned into a Shopify-ready catalog experience.

It covers three parts:

- loading catalog data from sample JSON, a local JTL-style SQLite database, or a real external JTL database
- presenting parent products with child color variants and variant images inside an embedded Shopify app
- preparing structured product and variant payloads that can be used for Shopify sync operations

## What the app demonstrates

Inside the embedded app there are two main views:

- `/app/jtl-sync`
  Shows the catalog as grouped parent products with color variants, counts, and product detail pages.
- `/app/jtl-admin`
  Lets you inspect and edit the local JTL-style catalog data, add variants, and reseed the local database from sample data.

The start page at `/app` gives a quick overview of the current catalog and active data source.

## Data sources

The app supports three catalog sources:

1. Sample JSON in `jtl_data.json`
2. Local JTL-style SQLite data in `prisma/dev.sqlite`
3. Real external JTL database via `mssql`

By default, the app uses the sample JSON. That is the easiest and most stable mode for demos.

See [JTL_DB_SETUP.md](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/JTL_DB_SETUP.md) for the environment variables and query shape.

## Demo flow

If you want to show what the project does in a short walkthrough:

1. Open `/app`
2. Point out the active data source and catalog counts
3. Open `/app/jtl-sync` to show grouped products and color variants
4. Open a product detail page to show the parent/variant structure
5. Open `/app/jtl-admin` to show that the local JTL-style catalog can be edited and reseeded
6. Explain that the same catalog loader can switch from demo JSON to a real JTL database without changing the UI flow

## Local development

Install dependencies:

```bash
npm install
```

Prepare Prisma and session storage:

```bash
npm run setup
```

Optional: seed the local JTL-style DB from the sample catalog:

```bash
npm run jtl:seed
```

Run the Shopify app locally:

```bash
npm run dev
```

## Hosting on Render

For interview demos, the simplest hosting setup is Render with:

- `JTL_DATA_SOURCE=json` for stable demo data
- the public root page `/` as the shareable interviewer link
- `/app` reserved for the real embedded Shopify app flow

This repo now includes [render.yaml](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/render.yaml) with a starter web service definition.

### Render steps

1. Push this project to GitHub.
2. In Render, create a new Blueprint or Web Service from the repo.
3. Use the generated service URL as `SHOPIFY_APP_URL`.
4. Set these environment variables in Render:

- `NODE_ENV=production`
- `JTL_DATA_SOURCE=json`
- `SHOPIFY_APP_URL=https://your-service.onrender.com`
- `SHOPIFY_API_KEY=...`
- `SHOPIFY_API_SECRET=...`
- `SCOPES=...`

5. Update [shopify.app.toml](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/shopify.app.toml):

- set `application_url` to your Render URL
- set `[auth].redirect_urls` to use your Render URL

6. Run:

```bash
shopify app deploy
```

### Important note

The public homepage at `/` is the easiest link to share with an interviewer because it does not require Shopify store access.

The embedded app under `/app` still requires Shopify authentication and an installed app context.

## Useful scripts

- `npm run dev` - start Shopify local development
- `npm run setup` - generate Prisma client and apply migrations
- `npm run jtl:seed` - fill the local JTL-style DB from `jtl_data.json`
- `npm run build` - build the app
- `npm run typecheck` - run React Router typegen and TypeScript checks

## Key files

- [app/routes/app._index.jsx](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/app/routes/app._index.jsx)
- [app/routes/app.jtl-sync.jsx](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/app/routes/app.jtl-sync.jsx)
- [app/routes/app.jtl-admin.jsx](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/app/routes/app.jtl-admin.jsx)
- [app/jtlCatalog.server.js](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/app/jtlCatalog.server.js)
- [app/jtlSync.server.js](/Users/jicin/sdu/jtl-shopify-custom-sync/jtl-shop-sync-new/app/jtlSync.server.js)
