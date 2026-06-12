import { Link, useLoaderData } from "react-router";
import { loadJtlCatalog } from "../jtlCatalog.server.js";

export const loader = async ({ params }) => {
  const catalog = await loadJtlCatalog();
  const categories = catalog?.categories || [];

  for (const category of categories) {
    for (const product of category.products || []) {
      if ((product.parent_product?.vater_id || "") !== params.parentId) continue;

      return {
        category: category.title || "Default Category",
        parentId: params.parentId,
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

  throw new Response("Produkt nicht gefunden", { status: 404 });
};

function translateColor(value) {
  return {
    White: "Weiss",
    Black: "Schwarz",
    Brown: "Braun",
    Grey: "Grau",
    Gray: "Grau",
    Navy: "Marine",
    Olive: "Oliv",
    Red: "Rot",
    Green: "Gruen",
    Blue: "Blau",
    Yellow: "Gelb",
    Sand: "Sand",
    Forest: "Waldgruen",
    Tan: "Hellbraun",
  }[value] || value;
}

function getVariantDisplay(values = {}) {
  return translateColor(values.Color || values.Colour || "Variante");
}

function getVariantSwatch(values = {}) {
  const color = values.Color || values.Colour || "Variant";
  return {
    White: "#f8fafc",
    Black: "#111827",
    Brown: "#92400e",
    Grey: "#9ca3af",
    Gray: "#9ca3af",
    Navy: "#1e3a8a",
    Olive: "#4d5d39",
    Red: "#b91c1c",
    Green: "#15803d",
    Blue: "#2563eb",
    Yellow: "#eab308",
    Sand: "#d6d3c9",
    Forest: "#14532d",
    Tan: "#c08a53",
  }[color] || "#cbd5e1";
}

function getProductKind(productType, title) {
  const explicitType = (productType || "").toLowerCase();
  if (["hoodie", "tee", "sneaker"].includes(explicitType)) return explicitType;

  const value = (title || "").toLowerCase();
  if (value.includes("hoodie")) return "hoodie";
  if (value.includes("tee")) return "tee";
  if (value.includes("sneaker") || value.includes("shoe")) return "sneaker";
  return "generic";
}

function getVariantPreview(productType, title, values) {
  const color = getVariantSwatch(values);
  const label = getVariantDisplay(values);
  const kind = getProductKind(productType, title);
  const silhouettes = {
    hoodie: `
      <path d="M130 92c8-22 25-34 50-34s42 12 50 34l18 20-24 18v90h-88v-90l-24-18 18-20z" fill="${color}"/>
      <path d="M160 92c4-12 11-18 20-18s16 6 20 18" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
      <rect x="172" y="154" width="16" height="28" rx="7" fill="#0f172a" fill-opacity=".16"/>
    `,
    tee: `
      <path d="M124 96l28-24h56l28 24-18 28-18-10v98h-96v-98l-18 10-18-28z" fill="${color}"/>
      <path d="M156 76c4 10 12 16 24 16s20-6 24-16" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
    `,
    sneaker: `
      <path d="M92 170c22 0 46-8 64-24l24-22 16 18c8 9 18 15 30 18l30 7c8 2 14 10 14 18v13H92v-28z" fill="${color}"/>
      <path d="M104 198h158" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
      <path d="M146 136l20 16m8-18 18 16m8-18 18 16" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
    `,
    generic: `
      <rect x="118" y="86" width="124" height="124" rx="18" fill="${color}"/>
    `,
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 360 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fffdf8"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="360" height="360" rx="28" fill="url(#bg)"/>
      <ellipse cx="180" cy="286" rx="96" ry="24" fill="#0f172a" fill-opacity=".08"/>
      ${silhouettes[kind]}
      <rect x="24" y="24" width="112" height="34" rx="17" fill="#ffffff" fill-opacity=".92"/>
      <text x="80" y="46" font-family="Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="#0f172a">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function PublicProductDetail() {
  const product = useLoaderData();

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
        <Link to="/#demo" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
          Zurueck zur Demo
        </Link>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dfe3e8",
            borderRadius: "24px",
            padding: "1.5rem",
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
          }}
        >
          <img
            src={
              product.mainVariant?.image ||
              getVariantPreview(product.productType, product.title, product.mainVariant?.attributes || {})
            }
            alt={product.title}
            style={{ width: "100%", borderRadius: "18px", display: "block", background: "#e2e8f0" }}
          />

          <div>
            <div style={{ color: "#b45309", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.12em", fontSize: "0.78rem" }}>
              {product.category}
            </div>
            <h1 style={{ margin: "0.45rem 0 0 0", color: "#0f172a" }}>{product.title}</h1>
            <p style={{ margin: "0.85rem 0 0 0", color: "#475569", lineHeight: 1.7 }}>{product.description}</p>

            {product.mainVariant && (
              <div style={{ marginTop: "1rem", color: "#0f766e", fontWeight: 700 }}>
                Hauptvariante: {getVariantDisplay(product.mainVariant.attributes)} • ${Number(product.mainVariant.price || 0).toFixed(2)}
              </div>
            )}

            <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[product.mainVariant, ...product.variants].filter(Boolean).map((variant) => (
                <Link
                  key={variant.sku}
                  to={`/demo/variant/${encodeURIComponent(product.parentId)}/${encodeURIComponent(variant.sku)}`}
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "999px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: "0.9rem",
                      height: "0.9rem",
                      borderRadius: "999px",
                      background: getVariantSwatch(variant.attributes || {}),
                      display: "inline-block",
                    }}
                  />
                  {getVariantDisplay(variant.attributes)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
