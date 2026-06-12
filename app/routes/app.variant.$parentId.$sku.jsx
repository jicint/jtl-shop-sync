import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getJtlVariantDetail } from "../jtlSync.server";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);

  const variant = await getJtlVariantDetail(params.parentId, params.sku);
  if (!variant) {
    throw new Response("Variante nicht gefunden", { status: 404 });
  }

  return variant;
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

function buildVariantImage(kind, color, label, viewLabel) {
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
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 360 360">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fffdf8"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="360" height="360" rx="28" fill="url(#bg)"/>
      <ellipse cx="180" cy="286" rx="96" ry="24" fill="#0f172a" fill-opacity=".08"/>
      ${silhouettes[kind]}
      <rect x="24" y="24" width="128" height="34" rx="17" fill="#ffffff" fill-opacity=".94"/>
      <text x="88" y="46" font-family="Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="#0f172a">${label}</text>
      <rect x="222" y="24" width="114" height="34" rx="17" fill="#0f172a" fill-opacity=".84"/>
      <text x="279" y="46" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="#f8fafc">${viewLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function VariantDetail() {
  const variant = useLoaderData();
  const label = getVariantDisplay(variant.attributes);
  const swatch = getVariantSwatch(variant.attributes);
  const kind = getProductKind(variant.productType, variant.title);
  const gallery = [
    buildVariantImage(kind, swatch, label, "Front"),
    buildVariantImage(kind, swatch, label, "Studio"),
    buildVariantImage(kind, swatch, label, "Detail"),
  ].filter(Boolean);

  return (
    <s-page heading={`${variant.title} - ${label}`}>
      <s-button slot="primary-action" href="/app/jtl-sync" variant="secondary">
        Zurueck zu den Produkten
      </s-button>

      <s-section>
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)",
          }}
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dfe3e8",
                borderRadius: "16px",
                padding: "1rem",
              }}
            >
              <img
                src={gallery[0]}
                alt={`${variant.title} ${label}`}
                style={{ width: "100%", borderRadius: "12px", display: "block", background: "#f8fafc" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              {gallery.slice(1).map((image, index) => (
                <div
                  key={`${variant.sku}-gallery-${index}`}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dfe3e8",
                    borderRadius: "14px",
                    padding: "0.85rem",
                  }}
                >
                  <img
                    src={image}
                    alt={`${variant.title} ${label} ${index + 2}`}
                    style={{ width: "100%", borderRadius: "10px", display: "block", background: "#f8fafc" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dfe3e8",
                borderRadius: "16px",
                padding: "1rem",
              }}
            >
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>{variant.title}</div>
              <div style={{ color: "#6b7280", marginTop: "0.35rem" }}>{variant.category}</div>
              <div style={{ color: "#0f766e", fontSize: "1.35rem", fontWeight: 700, marginTop: "0.85rem" }}>
                ${Number(variant.price || 0).toFixed(2)}
              </div>
              <div style={{ color: "#64748b", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                Produktansichten
              </div>
              <p style={{ color: "#334155", lineHeight: 1.6, marginTop: "0.85rem" }}>{variant.description}</p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dfe3e8",
                borderRadius: "16px",
                padding: "1rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "#111827", marginBottom: "0.85rem" }}>Varianteninformationen</div>
              <div style={{ display: "grid", gap: "0.7rem" }}>
                <div><strong>SKU:</strong> {variant.sku}</div>
                <div><strong>Hauptprodukt-ID:</strong> {variant.parentId}</div>
                <div><strong>Farbe:</strong> {label}</div>
                {variant.skuPrefix && <div><strong>SKU-Praefix:</strong> {variant.skuPrefix}</div>}
              </div>
            </div>
          </div>
        </div>
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
