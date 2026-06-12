import { redirect, Link, useLoaderData } from "react-router";
import { getJtlSyncOverview } from "../../jtlSync.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  const overview = await getJtlSyncOverview();

  return {
    overview,
  };
};

function dataSourceLabel(value) {
  return {
    "local-jtl-db": "Lokale JTL DB",
    "sample-json": "Beispiel JSON",
    "real-jtl-db": "Reale JTL DB",
    unknown: "Unbekannt",
  }[value] || value;
}

function variantLabel(attributes = {}) {
  return attributes.Color || attributes.Colour || "Variante";
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
    Red: "#b91c1c",
    Blue: "#2563eb",
    Green: "#15803d",
    Yellow: "#eab308",
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
  const label = variantLabel(values);
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

export default function PublicIndex() {
  const { overview } = useLoaderData();
  const featuredProducts = overview.sourceProducts.slice(0, 4);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>JTL x Shopify Demo</div>
          <h1 className={styles.heading}>Produktdaten aus JTL als Shopify-Katalog zeigen</h1>
          <p className={styles.text}>
            Diese Demo laedt JTL-artige Produktdaten, gruppiert Elternprodukte mit Farbvarianten
            und zeigt, wie daraus eine Shopify-taugliche Katalogansicht entsteht.
          </p>

          <div className={styles.badges}>
            <span className={styles.badge}>Datenquelle: {dataSourceLabel(overview.dataSource)}</span>
            <span className={styles.badge}>{overview.productCount} Produkte</span>
            <span className={styles.badge}>{overview.variantCount} Varianten</span>
          </div>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#demo">
              Demo ansehen
            </a>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span>Kataloge</span>
              <strong>{overview.categoryCount}</strong>
            </div>
            <div className={styles.statCard}>
              <span>Produkte</span>
              <strong>{overview.productCount}</strong>
            </div>
            <div className={styles.statCard}>
              <span>Varianten</span>
              <strong>{overview.variantCount}</strong>
            </div>
            <div className={styles.statCard}>
              <span>Bilder</span>
              <strong>{overview.imageCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Ablauf</div>
            <h2>So erklaerst du das Projekt in 30 Sekunden</h2>
          </div>
        </div>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <strong>1. Daten laden</strong>
            <p>Der Katalog kommt aus Demo JSON, einer lokalen JTL-artigen SQLite DB oder spaeter aus einer echten JTL Datenbank.</p>
          </div>
          <div className={styles.stepCard}>
            <strong>2. Struktur verstehen</strong>
            <p>Jedes Hauptprodukt wird mit Varianten, Farben, Preisen und Bildern gruppiert.</p>
          </div>
        </div>
      </section>

      <section className={styles.section} id="demo">
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Live Demo</div>
            <h2>Beispielprodukte</h2>
          </div>
        </div>

        <div className={styles.productGrid}>
          {featuredProducts.map((product) => (
            <Link
              key={product.parentId || product.title}
              to={`/demo/product/${encodeURIComponent(product.parentId)}`}
              className={styles.productCard}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <img
                className={styles.productImage}
                src={
                  product.mainVariant?.image ||
                  getVariantPreview(
                    product.productType,
                    product.title,
                    product.mainVariant?.attributes || {},
                  )
                }
                alt={product.title}
              />
              <div className={styles.productMeta}>{product.category}</div>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <div className={styles.productStats}>
                <span>Hauptfarbe: {variantLabel(product.mainVariant?.attributes)}</span>
                <span>{product.variantCount} weitere Farben</span>
              </div>
              <div className={styles.variantList}>
                {[product.mainVariant, ...product.variants]
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((variant) => (
                    <div key={variant.sku} className={styles.variantChip}>
                      <span
                        className={styles.variantSwatch}
                        style={{ backgroundColor: getVariantSwatch(variant.attributes || {}) }}
                      />
                      {variantLabel(variant.attributes)}
                    </div>
                  ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
