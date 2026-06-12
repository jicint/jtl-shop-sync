# JTL Database Setup

The app can load product data from three sources:

- local JTL-style SQLite DB inside this project
- sample `jtl_data.json`
- real external JTL database

## Data source switch

Default behavior:

- if `JTL_DATA_SOURCE` is not set, the app uses `jtl_data.json`
- this is the best option for a stable demo/interview setup

```bash
JTL_DATA_SOURCE=json
```

Also uses `jtl_data.json`.

```bash
JTL_DATA_SOURCE=local
```

Uses the local JTL-style SQLite DB inside this project.

```bash
JTL_DATA_SOURCE=database
```

Uses a real external JTL database.

## Real external JTL DB

Set:

```bash
JTL_DATA_SOURCE=database
JTL_DB_SERVER=your-sql-server-host
JTL_DB_PORT=1433
JTL_DB_DATABASE=your-jtl-database
JTL_DB_USER=your-user
JTL_DB_PASSWORD=your-password
JTL_DB_ENCRYPT=true
JTL_DB_TRUST_SERVER_CERTIFICATE=true
```

You also need `JTL_DB_QUERY`. The query must return rows in this shape:

```sql
SELECT
  category_title,
  parent_id,
  parent_title,
  product_type,
  description,
  sku_prefix,
  kind_id,
  sku,
  color,
  price,
  child_image,
  child_gallery
FROM your_jtl_product_view
```

Notes:

- `child_gallery` can be a JSON array string or a comma-separated list of image URLs.
- Each row should represent one child variant.
- The app groups rows into parent products and categories automatically.

## Local JTL DB

The local JTL-style DB file is:

`prisma/dev.sqlite`

The admin UI is:

`/app/jtl-admin`
