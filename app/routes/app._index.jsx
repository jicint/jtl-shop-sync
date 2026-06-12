import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getJtlSyncOverview } from "../jtlSync.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return await getJtlSyncOverview();
};

function renderStatCard(label, value, tone = "#111827") {
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
      <div style={{ color: tone, fontSize: "1.75rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function featureCard(title, text) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dfe3e8",
        borderRadius: "14px",
        padding: "1rem",
      }}
    >
      <div style={{ color: "#111827", fontWeight: 700 }}>{title}</div>
      <p style={{ color: "#475569", lineHeight: 1.6, margin: "0.45rem 0 0 0" }}>{text}</p>
    </div>
  );
}

function dataSourceLabel(value) {
  return {
    "local-jtl-db": "Lokale JTL DB",
    "sample-json": "Beispiel JSON",
    "real-jtl-db": "Reale JTL DB",
    unknown: "Unbekannt",
  }[value] || value;
}

export default function Index() {
  const overview = useLoaderData();

  return (
    <s-page heading="Start">
      <s-button slot="primary-action" href="/app/jtl-sync">
        Produkte anzeigen
      </s-button>

      <s-section>
        <div
          style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #eff6ff 55%, #ecfeff 100%)",
            border: "1px solid #dfe3e8",
            borderRadius: "20px",
            padding: "1.4rem",
          }}
        >
          <div style={{ color: "#0f172a", fontSize: "1.35rem", fontWeight: 800 }}>
            JTL Produktdaten sichtbar in Shopify machen
          </div>
          <p style={{ margin: "0.65rem 0 0 0", color: "#334155", lineHeight: 1.7, maxWidth: "70ch" }}>
            Diese Demo zeigt, wie JTL Katalogdaten aus Beispiel JSON, einer lokalen JTL-artigen DB
            oder einer echten externen JTL Datenbank geladen, gruppiert und als Shopify-tauglicher
            Produktkatalog dargestellt werden.
          </p>
          <div
            style={{
              marginTop: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.75rem",
              borderRadius: "999px",
              background: "#ffffff",
              border: "1px solid #dbe2ea",
              color: "#0f172a",
              fontSize: "0.92rem",
              fontWeight: 700,
            }}
          >
            Aktive Datenquelle: {dataSourceLabel(overview.dataSource)}
          </div>
        </div>
      </s-section>

      <s-section heading="Kennzahlen">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {renderStatCard("Kataloge", overview.categoryCount)}
          {renderStatCard("Produkte", overview.productCount, "#0f766e")}
          {renderStatCard("Farben", overview.variantCount, "#1d4ed8")}
          {renderStatCard("Bilder", overview.imageCount, "#b45309")}
        </div>
      </s-section>

      <s-section heading="Was diese App zeigt">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {featureCard(
            "1. JTL Daten einlesen",
            "Die App kann denselben Katalog aus Demo JSON, lokaler SQLite oder einer echten externen JTL Datenbank laden.",
          )}
          {featureCard(
            "2. Eltern- und Variantenlogik",
            "Ein Hauptprodukt wird mit Farbvarianten, Preisen und Bildern gruppiert, damit die Struktur in Shopify klar gezeigt werden kann.",
          )}
          {featureCard(
            "3. Admin und Demo zusammen",
            "Im Admin Bereich kannst du die lokale JTL-artige Datenbasis aendern und sofort sehen, wie sich die Katalogansicht verhaelt.",
          )}
        </div>
      </s-section>

      <s-section heading="Demo Ablauf">
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dfe3e8",
            borderRadius: "16px",
            padding: "1.1rem 1.2rem",
            color: "#334155",
            lineHeight: 1.7,
          }}
        >
          <div>
            1. Starte hier auf der Uebersicht und erklaere die aktive Datenquelle.
          </div>
          <div>
            2. Oeffne <strong>/app/jtl-sync</strong> und zeige die Produktgruppen und Farbvarianten.
          </div>
          <div>
            3. Oeffne ein Produkt fuer die Detailansicht mit Hauptprodukt und Varianten.
          </div>
          <div>
            4. Wechsle zu <strong>/app/jtl-admin</strong>, bearbeite lokale Daten und zeige, dass dieselbe Struktur aus einer JTL Quelle steuerbar ist.
          </div>
        </div>
      </s-section>

      <s-section heading="Produktvorschau">
        <div style={{ display: "grid", gap: "1rem" }}>
          {overview.previewCategories.map((category) => (
            <div
              key={category.title}
              style={{
                background: "#ffffff",
                border: "1px solid #dfe3e8",
                borderRadius: "12px",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#111827" }}>
                    {category.title === "Catalog" ? "Produktkatalog" : category.title}
                  </div>
                  <div style={{ color: "#6b7280", marginTop: "0.25rem" }}>
                    {category.productCount} Produkte, {category.variantCount} Farben
                  </div>
                </div>
                <s-button href="/app/jtl-sync" variant="secondary">
                  Produkte zeigen
                </s-button>
              </div>

              {category.sampleProducts.length > 0 && (
                <div style={{ marginTop: "0.9rem", color: "#475569" }}>
                  {category.sampleProducts.join(" • ")}
                </div>
              )}
            </div>
          ))}
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
