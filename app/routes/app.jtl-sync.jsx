import { Link, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getJtlSyncOverview } from "../jtlSync.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return await getJtlSyncOverview();
};

function statCard(label, value) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dfe3e8",
        borderRadius: "12px",
        padding: "1rem",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "0.35rem" }}>{label}</div>
      <div style={{ color: "#111827", fontSize: "1.6rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function getDataSourceLabel(value) {
  return {
    "local-jtl-db": "Lokale JTL DB",
    "sample-json": "Beispiel JSON",
    "real-jtl-db": "Reale JTL DB",
    unknown: "Unbekannt",
  }[value] || value;
}

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
  return translateColor(values.Color || values.Colour || "Variante");
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

export default function JtlSync() {
  const overview = useLoaderData();
  const hasProducts = overview.sourceProducts.length > 0;

  return (
    <s-page heading="Produkte">
      <s-section>
        <div
          style={{
            background: "linear-gradient(135deg, #fffdf8 0%, #eef2ff 100%)",
            border: "1px solid #dfe3e8",
            borderRadius: "16px",
            padding: "1.25rem",
          }}
        >
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.4rem" }}>
            Produkte anzeigen
          </div>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
            Jedes Hauptprodukt hat eine Hauptfarbe. Oeffne es, um die weiteren Farbvarianten zu sehen.
          </p>
          <div
            style={{
              marginTop: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.4rem 0.7rem",
              borderRadius: "999px",
              background: "#ffffff",
              border: "1px solid #dbe2ea",
              color: "#0f172a",
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            Datenquelle: {getDataSourceLabel(overview.dataSource)}
          </div>
        </div>
      </s-section>

      <s-section heading="Uebersicht">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {statCard("Kataloge", overview.categoryCount)}
          {statCard("Produkte", overview.productCount)}
          {statCard("Weitere Farben", overview.variantCount)}
        </div>
      </s-section>

      <s-section heading="Produktliste">
        {hasProducts ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {overview.sourceProducts.map((product) => (
              <div
                key={product.parentId || product.title}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dfe3e8",
                  borderRadius: "14px",
                  padding: "1rem",
                  display: "grid",
                  gap: "1rem",
                  gridTemplateColumns: "220px minmax(0, 1fr)",
                }}
              >
                <Link
                  to={`/app/product/${encodeURIComponent(product.parentId)}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <img
                    src={getVariantPreview(product.productType, product.title, product.mainVariant?.attributes || {})}
                    alt={product.title}
                    style={{
                      width: "100%",
                      height: "220px",
                      borderRadius: "12px",
                      display: "block",
                      objectFit: "cover",
                      background: "#e2e8f0",
                    }}
                  />
                </Link>

                <div>
                  <Link
                    to={`/app/product/${encodeURIComponent(product.parentId)}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.05rem" }}>{product.title}</div>
                  </Link>
                  <div style={{ color: "#6b7280", marginTop: "0.25rem" }}>{product.category}</div>
                  <p style={{ margin: "0.75rem 0 0 0", color: "#334155", lineHeight: 1.5 }}>
                    {product.description}
                  </p>
                  {product.mainVariant && (
                    <div style={{ marginTop: "0.85rem", color: "#111827", fontWeight: 700 }}>
                      Hauptfarbe: {getVariantDisplay(product.mainVariant.attributes)}
                    </div>
                  )}
                  <div style={{ marginTop: "0.35rem", color: "#6b7280" }}>
                    {product.variantCount} weitere Farben
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.9rem" }}>
                    {[product.mainVariant, ...product.variants].filter(Boolean).slice(0, 5).map((variant) => (
                      <Link
                        key={variant.sku}
                        to={`/app/variant/${encodeURIComponent(product.parentId)}/${encodeURIComponent(variant.sku)}`}
                        style={{
                          textDecoration: "none",
                          background: "#f8fafc",
                          border: "1px solid #dbe2ea",
                          borderRadius: "999px",
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.85rem",
                          color: "#334155",
                        }}
                      >
                        {getVariantDisplay(variant.attributes)}
                      </Link>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <Link
                      to={`/app/product/${encodeURIComponent(product.parentId)}`}
                      style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}
                    >
                      Produkt oeffnen
                    </Link>
                    {product.mainVariant && (
                      <Link
                        to={`/app/variant/${encodeURIComponent(product.parentId)}/${encodeURIComponent(product.mainVariant.sku)}`}
                        style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none" }}
                      >
                        Hauptvariante oeffnen
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "1.25rem",
              color: "#334155",
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: "#111827", fontWeight: 700 }}>Keine Produkte geladen</div>
            <p style={{ margin: "0.5rem 0 0 0" }}>
              Die aktuelle Datenquelle hat keine sichtbaren Produkte geliefert. Wenn du lokal arbeitest,
              oeffne <strong>/app/jtl-admin</strong> und fuelle die lokale DB neu aus den Beispieldaten
              oder setze `JTL_DATA_SOURCE=json` fuer die stabile Demoansicht.
            </p>
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
