import { redirect, Form, useLoaderData } from "react-router";
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
            <a className={styles.secondaryAction} href="/app">
              Embedded App oeffnen
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

          <div className={styles.storyCard}>
            <div className={styles.storyTitle}>Was der Interviewer hier sehen soll</div>
            <ul className={styles.storyList}>
              <li>Mehrere Datenquellen: JSON, lokale DB oder echte JTL DB</li>
              <li>Elternprodukte mit Kindvarianten und Farblogik</li>
              <li>Eine oeffentliche Demoansicht plus embedded Shopify-App</li>
            </ul>
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
          <div className={styles.stepCard}>
            <strong>3. Shopify zeigen</strong>
            <p>Die gleiche Datenstruktur wird in der embedded App fuer Sync, Vorschau und Admin genutzt.</p>
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
            <article key={product.parentId || product.title} className={styles.productCard}>
              <div className={styles.productMeta}>{product.category}</div>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <div className={styles.productStats}>
                <span>Hauptfarbe: {product.mainVariant?.attributes?.Color || "Variante"}</span>
                <span>{product.variantCount} weitere Farben</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Shopify Zugang</div>
            <h2>Embedded App Login</h2>
          </div>
        </div>

        <div className={styles.loginPanel}>
          <p>
            Die oeffentliche Startseite ist fuer Interviews gedacht. Der Shopify-embedded Bereich
            unter <code>/app</code> braucht weiterhin eine Shop-Installation und Authentifizierung.
          </p>
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" placeholder="your-store.myshopify.com" />
            </label>
            <button className={styles.button} type="submit">
              In Shopify anmelden
            </button>
          </Form>
        </div>
      </section>
    </main>
  );
}
