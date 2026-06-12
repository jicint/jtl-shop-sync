import { loadJtlCatalog } from "./jtlCatalog.server.js";

export async function getJtlCategories() {
  const parsed = await loadJtlCatalog();
  if (parsed?.categories) return parsed.categories;
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.products) return [{ title: "Default Category", products: parsed.products }];
  return [{ title: "Default Category", products: [parsed] }];
}

export async function getJtlSyncOverview() {
  const catalog = await loadJtlCatalog();
  const categories = catalog?.categories
    ? catalog.categories
    : Array.isArray(catalog)
      ? catalog
      : catalog?.products
        ? [{ title: "Default Category", products: catalog.products }]
        : [{ title: "Default Category", products: [catalog] }];
  const sourceProducts = categories.flatMap((category) =>
    (category.products || []).map((product) => {
      const variants = product.child_variants || [];
      const [mainVariant, ...childVariants] = variants;

      return {
        category: category.title || "Default Category",
        title: product.parent_product?.title || "Untitled product",
        productType: product.parent_product?.product_type || "",
        description: product.parent_product?.description || "",
        skuPrefix: product.parent_product?.sku_prefix || "",
        parentId: product.parent_product?.vater_id || "",
        mainVariant: mainVariant
          ? {
              sku: mainVariant.sku,
              price: mainVariant.price,
              attributes: mainVariant.attributes || {},
              image: mainVariant.child_image || "",
            }
          : null,
        variantCount: childVariants.length,
        variants: childVariants.slice(0, 4).map((variant) => ({
          sku: variant.sku,
          price: variant.price,
          attributes: variant.attributes || {},
          image: variant.child_image || "",
        })),
      };
    }),
  );

  const previewCategories = categories.slice(0, 5).map((category) => {
    const products = category.products || [];
    const variantCount = products.reduce(
      (count, product) => count + Math.max((product.child_variants?.length || 0) - 1, 0),
      0,
    );

    return {
      title: category.title || "Default Category",
      productCount: products.length,
      variantCount,
      sampleProducts: products
        .slice(0, 3)
        .map((product) => product.parent_product?.title)
        .filter(Boolean),
    };
  });

  return {
    categoryCount: categories.length,
    productCount: categories.reduce(
      (count, category) => count + (category.products?.length || 0),
      0,
    ),
    variantCount: categories.reduce(
      (count, category) =>
        count +
        (category.products || []).reduce(
          (productCount, product) =>
            productCount + Math.max((product.child_variants?.length || 0) - 1, 0),
          0,
        ),
      0,
    ),
    imageCount: categories.reduce(
      (count, category) =>
        count +
        (category.products || []).reduce(
          (productCount, product) =>
            productCount +
            (product.child_variants || []).filter((variant) => Boolean(variant.child_image)).length,
          0,
        ),
      0,
    ),
    dataSource: catalog?.source || "unknown",
    previewCategories,
    sourceProducts,
  };
}

export async function getJtlVariantDetail(parentId, sku) {
  const categories = await getJtlCategories();

  for (const category of categories) {
    for (const product of category.products || []) {
      const matchesParent = (product.parent_product?.vater_id || "") === parentId;
      if (!matchesParent) continue;

      const child = (product.child_variants || []).find((variant) => variant.sku === sku);
      if (!child) continue;

      return {
        category: category.title || "Default Category",
        parentId,
        title: product.parent_product?.title || "Untitled product",
        productType: product.parent_product?.product_type || "",
        description: product.parent_product?.description || "",
        skuPrefix: product.parent_product?.sku_prefix || "",
        sku: child.sku,
        price: child.price,
        attributes: child.attributes || {},
        image: child.child_image || "",
        gallery: child.child_gallery || [],
      };
    }
  }

  return null;
}

export async function getJtlParentDetail(parentId) {
  const categories = await getJtlCategories();

  for (const category of categories) {
    for (const product of category.products || []) {
      if ((product.parent_product?.vater_id || "") !== parentId) continue;

      return {
        category: category.title || "Default Category",
        parentId,
        title: product.parent_product?.title || "Untitled product",
        productType: product.parent_product?.product_type || "",
        description: product.parent_product?.description || "",
        skuPrefix: product.parent_product?.sku_prefix || "",
        mainVariant: product.child_variants?.[0]
          ? {
              sku: product.child_variants[0].sku,
              price: product.child_variants[0].price,
              attributes: product.child_variants[0].attributes || {},
              image: product.child_variants[0].child_image || "",
              gallery: product.child_variants[0].child_gallery || [],
            }
          : null,
        variantCount: Math.max((product.child_variants?.length || 0) - 1, 0),
        variants: (product.child_variants || []).slice(1).map((variant) => ({
          sku: variant.sku,
          price: variant.price,
          attributes: variant.attributes || {},
          image: variant.child_image || "",
          gallery: variant.child_gallery || [],
        })),
      };
    }
  }

  return null;
}

function getOptionNames(data) {
  const optionNames = Object.keys(data.child_variants[0]?.attributes || {});
  const colorOption = optionNames.find((name) => name === "Color" || name === "Colour");

  if (colorOption) {
    return [colorOption];
  }

  const priority = ["Color", "Colour", "Size", "Material", "Style"];

  return optionNames.sort((left, right) => {
    const leftPriority = priority.indexOf(left);
    const rightPriority = priority.indexOf(right);

    if (leftPriority === -1 && rightPriority === -1) {
      return left.localeCompare(right);
    }
    if (leftPriority === -1) return 1;
    if (rightPriority === -1) return -1;
    return leftPriority - rightPriority;
  });
}

function getOptionValues(data, optionNames) {
  return optionNames.map((name) =>
    Array.from(new Set(data.child_variants.map((child) => child.attributes[name] || "")))
  );
}

function buildUniqueHandle(title, product) {
  const baseHandle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const idSuffix = product.parent_product?.vater_id
    ? product.parent_product.vater_id.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : null;

  // Add timestamp (milliseconds since epoch) to ensure uniqueness across multiple syncs
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  
  return idSuffix ? `${baseHandle}-${idSuffix}-${timestamp}` : `${baseHandle}-${timestamp}`;
}

export function buildProductCreateInput(product) {
  const optionNames = getOptionNames(product);
  const optionValues = getOptionValues(product, optionNames);

  return {
    title: product.parent_product.title,
    handle: buildUniqueHandle(product.parent_product.title, product),
    descriptionHtml: product.parent_product.description,
    productOptions: optionNames.map((name, index) => ({
      name,
      values: optionValues[index].map((value) => ({ name: value })),
    })),
  };
}

export function buildVariantInputs(productOptions, product, skipVariantKey = null) {
  const optionNames = getOptionNames(product);

  return product.child_variants
    .map((child) => {
      const variant = {
        price: String(child.price.toFixed(2)),
        optionValues: optionNames.map((optionName) => ({
          optionId: productOptions[optionName].id,
          name: child.attributes[optionName],
        })),
        ...(child.child_image ? { mediaSrc: [child.child_image] } : {}),
      };

      const variantKey = optionNames
        .map((optionName) => `${optionName}:${child.attributes[optionName]}`)
        .join("|");
      return { variant, variantKey };
    })
    .filter(({ variantKey }) => (skipVariantKey ? variantKey !== skipVariantKey : true))
    .map(({ variant }) => variant);
}

export function buildVariantKey(attributes, product) {
  const optionNames = getOptionNames(product);
  return optionNames.map((name) => `${name}:${attributes[name]}`).join("|");
}

export function buildProductImageInputs(variantIdMap, product) {
  return product.child_variants
    .map((child) => {
      const variantKey = buildVariantKey(child.attributes, product);
      const variantId = variantIdMap[variantKey];
      if (!variantId) return null;

      return {
        alt: `${product.parent_product.title} - ${Object.values(child.attributes).join(" / ")}`,
        mediaContentType: "IMAGE",
        originalSource: child.child_image,
      };
    })
    .filter(Boolean);
}

export async function syncJtlCatalog(admin) {
  const categoriesData = await getJtlCategories();

  const createdCollections = [];
  const createdProducts = [];
  const uploadedImages = [];
  const allErrors = [];
  const operations = [];

  for (const categoryData of categoriesData) {
    const categoryTitle = categoryData.title || "Default Category";
    operations.push({
      type: "collection",
      title: categoryTitle,
      status: "started",
      message: `Creating collection for ${categoryTitle}`,
    });

    const collectionResponse = await admin.graphql(
      `#graphql
        mutation collectionCreate($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection {
              id
              title
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: { title: categoryTitle },
        },
      },
    );

    const collectionJson = await collectionResponse.json();
    const collectionErrors = collectionJson?.data?.collectionCreate?.userErrors || [];
    if (collectionErrors.length > 0) {
      allErrors.push(...collectionErrors.map((error) => error.message));
      operations.push({
        type: "collection",
        title: categoryTitle,
        status: "error",
        message: collectionErrors.map((error) => error.message).join(", "),
      });
    }

    const collection = collectionJson?.data?.collectionCreate?.collection;
    if (collection) {
      operations.push({
        type: "collection",
        title: categoryTitle,
        status: "success",
        message: `Collection created: ${collection.title}`,
      });
    }
    const productIdsForCollection = [];
    const categoryProducts = categoryData.products || [];

    for (const productData of categoryProducts) {
      const productTitle = productData.parent_product?.title || "Untitled product";
      operations.push({
        type: "product",
        title: productTitle,
        status: "started",
        message: `Creating product ${productTitle}`,
      });

      const productResponse = await admin.graphql(
        `#graphql
          mutation productCreate($product: ProductCreateInput!) {
            productCreate(product: $product) {
              product {
                id
                title
                handle
                options {
                  id
                  name
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      sku
                      price
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        {
          variables: {
            product: buildProductCreateInput(productData),
          },
        },
      );

      const productJson = await productResponse.json();
      const productErrors = productJson?.data?.productCreate?.userErrors || [];
      if (productErrors.length > 0) {
        allErrors.push(...productErrors.map((error) => error.message));
        operations.push({
          type: "product",
          title: productTitle,
          status: "error",
          message: productErrors.map((error) => error.message).join(", "),
        });
        continue;
      }

      const product = productJson?.data?.productCreate?.product;
      if (!product) {
        allErrors.push("Product creation returned no product.");
        operations.push({
          type: "product",
          title: productTitle,
          status: "error",
          message: "Product creation returned no product.",
        });
        continue;
      }
      operations.push({
        type: "product",
        title: productTitle,
        status: "success",
        message: `Product created with handle ${product.handle}`,
      });

      const productOptions = Object.fromEntries(
        (product.options || []).map((option) => [option.name, { id: option.id }]),
      );

      const variantInputs = buildVariantInputs(productOptions, productData);
      let variantErrors = [];
      let createdVariantList = [];

      if (variantInputs.length > 0) {
        const variantsResponse = await admin.graphql(
          `#graphql
            mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkCreate(
                productId: $productId,
                variants: $variants,
                strategy: REMOVE_STANDALONE_VARIANT
              ) {
                productVariants {
                  id
                  sku
                  price
                  selectedOptions {
                    name
                    value
                  }
                  media(first: 5) {
                    nodes {
                      ... on MediaImage {
                        id
                        alt
                        image {
                          url
                        }
                      }
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          {
            variables: {
              productId: product.id,
              variants: variantInputs,
            },
          },
        );

        const variantsJson = await variantsResponse.json();
        const variantsResult = variantsJson?.data?.productVariantsBulkCreate;
        variantErrors = variantsResult?.userErrors || [];
        if (variantErrors.length > 0) {
          allErrors.push(...variantErrors.map((error) => error.message));
          operations.push({
            type: "variant",
            title: productTitle,
            status: "error",
            message: variantErrors.map((error) => error.message).join(", "),
          });
        }

        if (variantsResult?.productVariants) {
          const bulkVariants = variantsResult.productVariants.map((variant) => {
            return variant;
          });
          createdVariantList = bulkVariants;
          operations.push({
            type: "variant",
            title: productTitle,
            status: "success",
            message: `${bulkVariants.length} variants created`,
          });
        }
      }
      const uploadedVariantImages = createdVariantList.flatMap((variant) =>
        (variant.media?.nodes || []).map((media) => ({
          ...media,
          variantId: variant.id,
          variantOptions: variant.selectedOptions,
        })),
      );
      if (uploadedVariantImages.length > 0) {
        uploadedImages.push(...uploadedVariantImages);
        operations.push({
          type: "media",
          title: productTitle,
          status: "success",
          message: `${uploadedVariantImages.length} variant images matched`,
        });
      }

      createdProducts.push({
        ...product,
        category: categoryTitle,
        jtlParent: productData.parent_product,
        variants: createdVariantList,
      });
      productIdsForCollection.push(product.id);
    }

    if (collection && productIdsForCollection.length > 0) {
      const addProductsResponse = await admin.graphql(
        `#graphql
          mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
            collectionAddProducts(id: $id, productIds: $productIds) {
              collection {
                id
                title
                products(first: 10) {
                  nodes {
                    id
                    title
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        {
          variables: {
            id: collection.id,
            productIds: productIdsForCollection,
          },
        },
      );

      const addProductsJson = await addProductsResponse.json();
      const addProductsResult = addProductsJson?.data?.collectionAddProducts;
      const addProductsErrors = addProductsResult?.userErrors || [];
      if (addProductsErrors.length > 0) {
        allErrors.push(...addProductsErrors.map((error) => error.message));
        operations.push({
          type: "collection-products",
          title: categoryTitle,
          status: "error",
          message: addProductsErrors.map((error) => error.message).join(", "),
        });
      }

      if (addProductsResult?.collection) {
        createdCollections.push(addProductsResult.collection);
        operations.push({
          type: "collection-products",
          title: categoryTitle,
          status: "success",
          message: `${productIdsForCollection.length} products added to collection`,
        });
      }
    } else if (collection) {
      createdCollections.push(collection);
    }
  }

  return {
    ok: allErrors.length === 0,
    syncedAt: new Date().toISOString(),
    summary: {
      collectionsCreated: createdCollections.length,
      productsCreated: createdProducts.length,
      imagesUploaded: uploadedImages.length,
      errors: allErrors.length,
    },
    createdCollections,
    createdProducts,
    uploadedImages,
    operations,
    errors: allErrors,
  };
}
