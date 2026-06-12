import fs from "fs";
import prisma from "../app/db.server.js";

/* eslint-disable no-undef */

function loadSampleCatalog() {
  const rawData = fs.readFileSync(new URL("../jtl_data.json", import.meta.url), "utf8");
  return JSON.parse(rawData);
}

async function main() {
  const catalog = loadSampleCatalog();
  const categories = catalog.categories || [];

  await prisma.jtlVariant.deleteMany();
  await prisma.jtlParentProduct.deleteMany();
  await prisma.jtlCategory.deleteMany();

  for (const category of categories) {
    const createdCategory = await prisma.jtlCategory.create({
      data: {
        title: category.title,
        handle: category.handle,
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

  console.log("Local JTL database seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
