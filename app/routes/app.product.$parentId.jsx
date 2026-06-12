import { Link, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getShopifyParentDetail } from "../jtlSync.server";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  const product = await getShopifyParentDetail(admin, params.parentId);
  if (!product) {
    throw new Response("Produkt nicht gefunden", { status: 404 });
  }

  return product;
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

function getVariantDisplay(values) {
  const color = translateColor(values.Color || values.Colour || "Variante");
  const size = values.Size || "";
  return size ? `${color} / ${size}` : color;
}

function getVariantSwatch(values) {
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
  if (value.includes("tee") || value.includes("t-shirt")) return "tee";
  if (value.includes("sneaker") || value.includes("shoe")) return "sneaker";
  return "generic";
}

function getVariantProductPreview(productType, title, values, viewLabel = "Front") {
  const color = getVariantSwatch(values);
  const label = getVariantDisplay(values);
  const kind = getProductKind(productType, title);
  const variantTransform =
    viewLabel === "Side"
      ? 'transform="translate(8, 0) scale(0.96, 1)"'
      : viewLabel === "Top"
      ? 'transform="translate(0, -10) scale(0.92)"'
      : "";
  const silhouettes = {
    hoodie: `
      <g ${variantTransform}>
        <path d="M130 92c8-22 25-34 50-34s42 12 50 34l18 20-24 18v90h-88v-90l-24-18 18-20z" fill="${color}"/>
        <path d="M160 92c4-12 11-18 20-18s16 6 20 18" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
        <path d="M130 100l-20 24m120-24 20 24" stroke="#0f172a" stroke-opacity=".18" stroke-width="8" stroke-linecap="round"/>
        <rect x="172" y="154" width="16" height="28" rx="7" fill="#0f172a" fill-opacity=".16"/>
      </g>
    `,
    tee: `
      <g ${variantTransform}>
        <path d="M124 96l28-24h56l28 24-18 28-18-10v98h-96v-98l-18 10-18-28z" fill="${color}"/>
        <path d="M156 76c4 10 12 16 24 16s20-6 24-16" fill="none" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
        <path d="M124 96l-14 20m126-20 14 20" stroke="#0f172a" stroke-opacity=".15" stroke-width="8" stroke-linecap="round"/>
      </g>
    `,
    sneaker: `
      <g ${variantTransform}>
        <path d="M92 170c22 0 46-8 64-24l24-22 16 18c8 9 18 15 30 18l30 7c8 2 14 10 14 18v13H92v-28z" fill="${color}"/>
        <path d="M104 198h158" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
        <path d="M146 136l20 16m8-18 18 16m8-18 18 16" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
        <path d="M92 170h178" stroke="#0f172a" stroke-opacity=".18" stroke-width="6" stroke-linecap="round"/>
      </g>
    `,
    generic: `
      <g ${variantTransform}>
        <rect x="118" y="86" width="124" height="124" rx="18" fill="${color}"/>
      </g>
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
      <rect x="236" y="24" width="100" height="34" rx="17" fill="#0f172a" fill-opacity=".86"/>
      <text x="286" y="46" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="#f8fafc">${viewLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function ParentProductDetail() {
  const product = useLoaderData();
  const views = ["Front", "Side", "Top"];

  return (
    <s-page heading={product.title}>
      <s-button slot="primary-action" href="/app/jtl-sync" variant="secondary">
        Zurueck zu den Produkten
      </s-button>

      <s-section>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dfe3e8",
            borderRadius: "16px",
            padding: "1rem",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827" }}>{product.title}</div>
          <div style={{ color: "#6b7280", marginTop: "0.35rem" }}>
            {product.category} • {product.variantCount} weitere Farben
          </div>
          {product.skuPrefix && (
            <div style={{ color: "#475569", marginTop: "0.5rem", fontFamily: "monospace" }}>
              {product.skuPrefix}
            </div>
          )}
          <p style={{ margin: "0.85rem 0 0 0", color: "#334155", lineHeight: 1.6 }}>{product.description}</p>
        </div>
      </s-section>

      {product.mainVariant && (
        <s-section heading="Hauptprodukt">
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfe3e8",
              borderRadius: "16px",
              padding: "1rem",
            }}
          >
            <img
              src={getVariantProductPreview(product.productType, product.title, product.mainVariant.attributes, "Front")}
              alt={`${product.title} ${getVariantDisplay(product.mainVariant.attributes)}`}
              style={{
                width: "100%",
                maxWidth: "420px",
                borderRadius: "12px",
                display: "block",
                background: "#e2e8f0",
              }}
            />
            <div style={{ fontWeight: 700, color: "#111827", marginTop: "0.85rem" }}>
              {product.title} - {getVariantDisplay(product.mainVariant.attributes)}
            </div>
            <div style={{ color: "#64748b", marginTop: "0.25rem" }}>{product.mainVariant.sku}</div>
            <div style={{ color: "#0f766e", marginTop: "0.35rem", fontWeight: 700 }}>
              ${Number(product.mainVariant.price || 0).toFixed(2)}
            </div>
          </div>
        </s-section>
      )}

      <s-section heading="Weitere Farben">
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {product.variants.map((variant) => (
            <Link
              key={variant.sku}
              to={`/app/variant/${encodeURIComponent(product.parentId)}/${encodeURIComponent(variant.sku)}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                background: "#ffffff",
                border: "1px solid #dfe3e8",
                borderRadius: "14px",
                padding: "1rem",
                display: "block",
              }}
            >
              <img
                src={getVariantProductPreview(product.productType, product.title, variant.attributes, "Front")}
                alt={`${product.title} ${getVariantDisplay(variant.attributes)}`}
                style={{
                  width: "100%",
                  height: "180px",
                  borderRadius: "10px",
                  display: "block",
                  objectFit: "cover",
                  background: "#e2e8f0",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "0.45rem",
                  marginTop: "0.75rem",
                }}
              >
                {views.map((view) => (
                  <div
                    key={`${variant.sku}-${view}`}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #dbe2ea",
                      borderRadius: "8px",
                      padding: "0.25rem",
                    }}
                  >
                    <img
                      src={getVariantProductPreview(product.productType, product.title, variant.attributes, view)}
                      alt={`${product.title} ${getVariantDisplay(variant.attributes)} ${view}`}
                      style={{
                        width: "100%",
                        height: "60px",
                        borderRadius: "6px",
                        display: "block",
                        objectFit: "cover",
                        background: "#e2e8f0",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 700, color: "#111827", marginTop: "0.8rem" }}>
                Farbe - {getVariantDisplay(variant.attributes)}
              </div>
              <div style={{ color: "#64748b", marginTop: "0.25rem" }}>{variant.sku}</div>
              <div style={{ color: "#0f766e", marginTop: "0.35rem", fontWeight: 700 }}>
                ${Number(variant.price || 0).toFixed(2)}
              </div>
              <div style={{ color: "#2563eb", marginTop: "0.75rem", fontWeight: 700 }}>
                Variante oeffnen
              </div>
            </Link>
          ))}
        </div>

        {product.variants.length > 0 && (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            {product.variants.map((variant) => (
              <Link
                key={`chip-${variant.sku}`}
                to={`/app/variant/${encodeURIComponent(product.parentId)}/${encodeURIComponent(variant.sku)}`}
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
                    width: "0.85rem",
                    height: "0.85rem",
                    borderRadius: "999px",
                    background: getVariantSwatch(variant.attributes),
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    display: "inline-block",
                  }}
                />
                {getVariantDisplay(variant.attributes)}
              </Link>
            ))}
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
