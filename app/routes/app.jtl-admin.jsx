import { Form, useActionData, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  createLocalJtlVariant,
  getExternalJtlDbStatus,
  getLocalJtlAdminData,
  reseedLocalJtlDbFromSample,
  updateLocalJtlProduct,
  updateLocalJtlVariant,
} from "../jtlCatalog.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return {
    categories: await getLocalJtlAdminData(),
    externalStatus: getExternalJtlDbStatus(),
  };
};

export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  try {
    if (intent === "update-product") {
      await updateLocalJtlProduct({
        id: formData.get("id"),
        categoryTitle: String(formData.get("categoryTitle") || "JTL Produkte"),
        title: String(formData.get("title") || ""),
        productType: String(formData.get("productType") || ""),
        description: String(formData.get("description") || ""),
        skuPrefix: String(formData.get("skuPrefix") || ""),
      });

      return { ok: true, message: "Produkt gespeichert." };
    }

    if (intent === "update-variant") {
      await updateLocalJtlVariant({
        id: formData.get("id"),
        color: String(formData.get("color") || ""),
        price: formData.get("price"),
        image: String(formData.get("image") || ""),
        gallery: String(formData.get("gallery") || ""),
      });

      return { ok: true, message: "Variante gespeichert." };
    }

    if (intent === "create-variant") {
      await createLocalJtlVariant({
        parentId: formData.get("parentId"),
        kindId: String(formData.get("kindId") || ""),
        sku: String(formData.get("sku") || ""),
        color: String(formData.get("color") || ""),
        price: formData.get("price"),
        image: String(formData.get("image") || ""),
        gallery: String(formData.get("gallery") || ""),
      });

      return { ok: true, message: "Neue Variante erstellt." };
    }

    if (intent === "reseed-local-db") {
      await reseedLocalJtlDbFromSample();
      return { ok: true, message: "Lokale JTL DB wurde neu aus den Beispieldaten aufgebaut." };
    }

    return { ok: false, message: "Unbekannte Aktion." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Speichern fehlgeschlagen." };
  }
};

function field(label, name, defaultValue, multiline = false) {
  return (
    <label style={{ display: "grid", gap: "0.35rem" }}>
      <span style={{ fontSize: "0.9rem", color: "#475569", fontWeight: 700 }}>{label}</span>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "0.75rem",
            font: "inherit",
            resize: "vertical",
          }}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "0.75rem",
            font: "inherit",
          }}
        />
      )}
    </label>
  );
}

function statusLabel(externalStatus) {
  if (externalStatus.dataSource === "database") {
    return externalStatus.configured ? "Reale JTL DB bereit" : "Reale JTL DB noch nicht konfiguriert";
  }

  if (externalStatus.dataSource === "local") {
    return "Lokale JTL DB aktiv";
  }

  return "Beispiel JSON aktiv";
}

export default function JtlAdminPage() {
  const { categories, externalStatus } = useLoaderData();
  const actionData = useActionData();

  return (
    <s-page heading="JTL Admin">
      <s-section>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfe3e8",
              borderRadius: "16px",
              padding: "1rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#111827" }}>Aktueller Status</div>
            <div style={{ marginTop: "0.5rem", color: "#334155" }}>{statusLabel(externalStatus)}</div>
            <div style={{ marginTop: "0.35rem", color: "#64748b", fontSize: "0.95rem" }}>
              Datenquelle: {externalStatus.dataSource === "database" ? "Reale JTL DB" : "Lokale JTL DB / Auto"}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dfe3e8",
              borderRadius: "16px",
              padding: "1rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#111827" }}>Externe JTL DB</div>
            <div style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.6 }}>
              Setze spaeter `JTL_DATA_SOURCE=database` plus die `JTL_DB_*` Variablen, wenn du deine echte JTL DB anbinden willst.
            </div>
          </div>
        </div>
      </s-section>

      <s-section>
        <Form method="post">
          <input type="hidden" name="intent" value="reseed-local-db" />
          <button
            type="submit"
            style={{
              border: "none",
              borderRadius: "12px",
              background: "#111827",
              color: "#ffffff",
              padding: "0.8rem 1rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Lokale DB aus Beispieldaten neu fuellen
          </button>
        </Form>

        {actionData?.message && (
          <div
            style={{
              marginTop: "1rem",
              background: actionData.ok ? "#ecfdf5" : "#fef2f2",
              color: actionData.ok ? "#065f46" : "#991b1b",
              border: `1px solid ${actionData.ok ? "#a7f3d0" : "#fecaca"}`,
              borderRadius: "12px",
              padding: "0.85rem 1rem",
            }}
          >
            {actionData.message}
          </div>
        )}
      </s-section>

      {categories.length === 0 && (
        <s-section>
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
            <div style={{ color: "#111827", fontWeight: 700 }}>Lokale JTL DB ist leer</div>
            <div style={{ marginTop: "0.5rem" }}>
              Nutze den Button oben, um die lokale Datenbank aus `jtl_data.json` neu zu fuellen.
            </div>
          </div>
        </s-section>
      )}

      {categories.map((category) => (
        <s-section key={category.id} heading={category.title}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {category.products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dfe3e8",
                  borderRadius: "16px",
                  padding: "1rem",
                }}
              >
                <Form method="post" style={{ display: "grid", gap: "0.9rem" }}>
                  <input type="hidden" name="intent" value="update-product" />
                  <input type="hidden" name="id" value={product.id} />
                  <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.1rem" }}>Produkt bearbeiten</div>
                  <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    {field("Kategorie", "categoryTitle", category.title)}
                    {field("Titel", "title", product.title)}
                    {field("Produkttyp", "productType", product.productType)}
                    {field("SKU-Praefix", "skuPrefix", product.skuPrefix)}
                  </div>
                  {field("Beschreibung", "description", product.description, true)}
                  <button
                    type="submit"
                    style={{
                      justifySelf: "start",
                      border: "none",
                      borderRadius: "10px",
                      background: "#2563eb",
                      color: "#ffffff",
                      padding: "0.7rem 0.95rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Produkt speichern
                  </button>
                </Form>

                <div style={{ marginTop: "1.25rem", display: "grid", gap: "0.9rem" }}>
                  {product.variants.map((variant) => (
                    <Form
                      key={variant.id}
                      method="post"
                      style={{
                        display: "grid",
                        gap: "0.8rem",
                        padding: "1rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                      }}
                    >
                      <input type="hidden" name="intent" value="update-variant" />
                      <input type="hidden" name="id" value={variant.id} />
                      <div style={{ fontWeight: 700, color: "#111827" }}>Variante: {variant.sku}</div>
                      <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                        {field("Farbe", "color", variant.color)}
                        {field("Preis", "price", variant.price)}
                        {field("Bild URL", "image", variant.image)}
                      </div>
                      {field("Galerie URLs", "gallery", variant.gallery.join(", "), true)}
                      <button
                        type="submit"
                        style={{
                          justifySelf: "start",
                          border: "none",
                          borderRadius: "10px",
                          background: "#0f766e",
                          color: "#ffffff",
                          padding: "0.7rem 0.95rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Variante speichern
                      </button>
                    </Form>
                  ))}

                  <Form
                    method="post"
                    style={{
                      display: "grid",
                      gap: "0.8rem",
                      padding: "1rem",
                      background: "#fffdf8",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "14px",
                    }}
                  >
                    <input type="hidden" name="intent" value="create-variant" />
                    <input type="hidden" name="parentId" value={product.id} />
                    <div style={{ fontWeight: 700, color: "#111827" }}>Neue Variante anlegen</div>
                    <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                      {field("Farbe", "color", "")}
                      {field("Preis", "price", "")}
                      {field("Bild URL", "image", "")}
                    </div>
                    <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                      {field("Kind-ID", "kindId", "")}
                      {field("SKU", "sku", "")}
                    </div>
                    {field("Galerie URLs", "gallery", "", true)}
                    <button
                      type="submit"
                      style={{
                        justifySelf: "start",
                        border: "none",
                        borderRadius: "10px",
                        background: "#7c3aed",
                        color: "#ffffff",
                        padding: "0.7rem 0.95rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Variante erstellen
                    </button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        </s-section>
      ))}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
