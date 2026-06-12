import fs from "fs";
import prisma from "./db.server.js";

function loadSampleCatalog() {
  const rawData = fs.readFileSync(new URL("../jtl_data.json", import.meta.url), "utf8");
  return JSON.parse(rawData);
}

function buildCategoryHandle(title) {
  return String(title || "jtl-produkte")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toBoolean(value, defaultValue = true) {
  if (value == null || value === "") return defaultValue;
  return String(value).toLowerCase() === "true";
}

function parseGallery(value, fallbackImage) {
  if (!value) return fallbackImage ? [fallbackImage] : [];

  if (Array.isArray(value)) return value.filter(Boolean);

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Ignore invalid JSON and fall through to CSV parsing.
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupRowsByParent(rows) {
  const categories = new Map();

  for (const row of rows) {
    const categoryTitle = row.category_title || row.category || "JTL Produkte";
    const parentId = row.parent_id || row.vater_id;
    if (!parentId) continue;

    if (!categories.has(categoryTitle)) {
      categories.set(categoryTitle, {
        title: categoryTitle,
        handle: categoryTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        products: [],
      });
    }

    const category = categories.get(categoryTitle);
    let product = category.products.find((entry) => entry.parent_product.vater_id === parentId);

    if (!product) {
      product = {
        parent_product: {
          vater_id: parentId,
          title: row.parent_title || row.title || "Unbenanntes Produkt",
          product_type: row.product_type || "",
          description: row.description || "",
          sku_prefix: row.sku_prefix || "",
        },
        child_variants: [],
      };
      category.products.push(product);
    }

    if (!row.sku) continue;

    const color = row.color || row.colour || row.variant_color || "";
    product.child_variants.push({
      kind_id: row.kind_id || row.child_id || row.kartikel,
      sku: row.sku,
      attributes: color ? { Color: color } : {},
      price: Number(row.price || 0),
      child_image: row.child_image || row.image || "",
      child_gallery: parseGallery(row.child_gallery, row.child_image || row.image || ""),
    });
  }

  return { categories: Array.from(categories.values()) };
}

async function loadCatalogFromLocalDb() {
  if (!prisma?.jtlCategory?.findMany) {
    return null;
  }

  const categories = await prisma.jtlCategory.findMany({
    orderBy: { id: "asc" },
    include: {
      products: {
        orderBy: { id: "asc" },
        include: {
          variants: {
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  if (categories.length === 0) return null;

  const productCount = categories.reduce((count, category) => count + category.products.length, 0);
  if (productCount === 0) return null;

  return {
    categories: categories.map((category) => ({
      title: category.title,
      handle: category.handle,
      products: category.products.map((product) => ({
        parent_product: {
          vater_id: product.vaterId,
          title: product.title,
          product_type: product.productType || "",
          description: product.description || "",
          sku_prefix: product.skuPrefix || "",
        },
        child_variants: product.variants.map((variant) => ({
          kind_id: variant.kindId || "",
          sku: variant.sku,
          attributes: variant.color ? { Color: variant.color } : {},
          price: variant.price,
          child_image: variant.image || "",
          child_gallery: parseGallery(variant.gallery, variant.image || ""),
        })),
      })),
    })),
  };
}

function mapLocalCategoryForAdmin(category) {
  return {
    id: category.id,
    title: category.title,
    handle: category.handle,
    products: category.products.map((product) => ({
      id: product.id,
      vaterId: product.vaterId,
      title: product.title,
      productType: product.productType || "",
      description: product.description || "",
      skuPrefix: product.skuPrefix || "",
      variants: product.variants.map((variant) => ({
        id: variant.id,
        kindId: variant.kindId || "",
        sku: variant.sku,
        color: variant.color || "",
        price: variant.price,
        image: variant.image || "",
        gallery: parseGallery(variant.gallery, variant.image || ""),
      })),
    })),
  };
}

async function loadCatalogFromDatabase() {
  const driver = await import("mssql");
  const sql = driver.default || driver;
  const query = process.env.JTL_DB_QUERY;

  if (!query) {
    throw new Error("JTL_DB_QUERY is required when JTL_DATA_SOURCE=database.");
  }

  const config = {
    server: process.env.JTL_DB_SERVER,
    database: process.env.JTL_DB_DATABASE,
    user: process.env.JTL_DB_USER,
    password: process.env.JTL_DB_PASSWORD,
    port: process.env.JTL_DB_PORT ? Number(process.env.JTL_DB_PORT) : 1433,
    options: {
      encrypt: toBoolean(process.env.JTL_DB_ENCRYPT, true),
      trustServerCertificate: toBoolean(process.env.JTL_DB_TRUST_SERVER_CERTIFICATE, true),
    },
  };

  if (!config.server || !config.database || !config.user || !config.password) {
    throw new Error(
      "JTL database credentials are incomplete. Set JTL_DB_SERVER, JTL_DB_DATABASE, JTL_DB_USER, and JTL_DB_PASSWORD.",
    );
  }

  const pool = await sql.connect(config);

  try {
    const result = await pool.request().query(query);
    return groupRowsByParent(result.recordset || []);
  } finally {
    await pool.close();
  }
}

function withSource(catalog, source) {
  return {
    ...catalog,
    source,
  };
}

export async function loadJtlCatalog() {
  if (!process.env.JTL_DATA_SOURCE || process.env.JTL_DATA_SOURCE === "json") {
    return withSource(loadSampleCatalog(), "sample-json");
  }

  if (process.env.JTL_DATA_SOURCE === "database") {
    return withSource(await loadCatalogFromDatabase(), "real-jtl-db");
  }

  if (process.env.JTL_DATA_SOURCE === "local") {
    try {
      const localCatalog = await loadCatalogFromLocalDb();
      if (localCatalog) return withSource(localCatalog, "local-jtl-db");
    } catch (error) {
      console.warn("Falling back to jtl_data.json because the local JTL DB is unavailable.", error);
    }
  }

  return withSource(loadSampleCatalog(), "sample-json");
}

export async function getLocalJtlAdminData() {
  if (!prisma?.jtlCategory?.findMany) {
    return [];
  }

  const categories = await prisma.jtlCategory.findMany({
    orderBy: { id: "asc" },
    include: {
      products: {
        orderBy: { id: "asc" },
        include: {
          variants: {
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  return categories.map(mapLocalCategoryForAdmin);
}

export async function updateLocalJtlProduct(input) {
  return prisma.jtlParentProduct.update({
    where: { id: Number(input.id) },
    data: {
      title: input.title,
      productType: input.productType,
      description: input.description,
      skuPrefix: input.skuPrefix,
      category: {
        connectOrCreate: {
          where: { handle: buildCategoryHandle(input.categoryTitle) },
          create: {
            title: input.categoryTitle,
            handle: buildCategoryHandle(input.categoryTitle),
          },
        },
      },
    },
  });
}

export async function updateLocalJtlVariant(input) {
  return prisma.jtlVariant.update({
    where: { id: Number(input.id) },
    data: {
      color: input.color,
      price: Number(input.price || 0),
      image: input.image,
      gallery: JSON.stringify(parseGallery(input.gallery, input.image)),
    },
  });
}

export async function createLocalJtlVariant(input) {
  const parent = await prisma.jtlParentProduct.findUnique({
    where: { id: Number(input.parentId) },
  });

  if (!parent) {
    throw new Error("Parent product not found.");
  }

  const colorSlug = String(input.color || "variant")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const sku = input.sku || `${parent.skuPrefix || parent.vaterId}-${colorSlug}`;

  return prisma.jtlVariant.create({
    data: {
      kindId: input.kindId || `${parent.vaterId}-${colorSlug}`,
      sku,
      color: input.color,
      price: Number(input.price || 0),
      image: input.image,
      gallery: JSON.stringify(parseGallery(input.gallery, input.image)),
      parentId: Number(input.parentId),
    },
  });
}

export async function reseedLocalJtlDbFromSample() {
  const catalog = loadSampleCatalog();
  const categories = catalog.categories || [];

  if (!prisma?.jtlCategory?.findMany) {
    return;
  }

  await prisma.jtlVariant.deleteMany();
  await prisma.jtlParentProduct.deleteMany();
  await prisma.jtlCategory.deleteMany();

  for (const category of categories) {
    const createdCategory = await prisma.jtlCategory.create({
      data: {
        title: category.title,
        handle: category.handle || buildCategoryHandle(category.title),
      },
    });

    for (const product of category.products || []) {
      const createdProduct = await prisma.jtlParentProduct.create({
        data: {
          vaterId: product.parent_product?.vater_id || "",
          title: product.parent_product?.title || "Unbenanntes Produkt",
          productType: product.parent_product?.product_type || "",
          description: product.parent_product?.description || "",
          skuPrefix: product.parent_product?.sku_prefix || "",
          categoryId: createdCategory.id,
        },
      });

      for (const variant of product.child_variants || []) {
        await prisma.jtlVariant.create({
          data: {
            kindId: variant.kind_id || "",
            sku: variant.sku || "",
            color: variant.attributes?.Color || variant.attributes?.Colour || "",
            price: Number(variant.price || 0),
            image: variant.child_image || "",
            gallery: JSON.stringify(variant.child_gallery || []),
            parentId: createdProduct.id,
          },
        });
      }
    }
  }
}

export function getExternalJtlDbStatus() {
  const configured = Boolean(
    process.env.JTL_DB_SERVER &&
      process.env.JTL_DB_DATABASE &&
      process.env.JTL_DB_USER &&
      process.env.JTL_DB_PASSWORD &&
      process.env.JTL_DB_QUERY,
  );

  return {
    dataSource: process.env.JTL_DATA_SOURCE || "json",
    configured,
    target:
      process.env.JTL_DATA_SOURCE === "database"
        ? "real-jtl-db"
        : process.env.JTL_DATA_SOURCE === "local"
          ? "local-jtl-db"
          : "sample-json",
  };
}
