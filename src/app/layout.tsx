import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { mirrinaoMetadata } from "@/projects/melendez/mirrinao/metadata";
import { assetPath } from "@/lib/asset-path";

// OG/Twitter usan la imagen exterior; con basePath hay que prefijar la ruta.
const OG_IMAGE = assetPath("/projects/melendez/mirrinao/images/exterior/building.jpg");

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Serif display de marca para títulos (afín al wordmark "Reserva de Mirriñao").
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Base (solo origen) para volver absolutas las URLs de OG/Twitter; el path
  // /Reserva_Mirrinao ya lo añade assetPath, así no se duplica.
  metadataBase: new URL("https://jhiguita11.github.io/"),
  title: "Reserva de Mirriñao | Recorrido Virtual 360°",
  description:
    "Explora la Casa Grande de Reserva de Mirriñao — Constructora Meléndez con tecnología panorámica interactiva 360°.",
  keywords: [
    "Reserva de Mirriñao",
    "Mirriñao",
    "Constructora Meléndez",
    "recorrido 360",
    "tour virtual",
    "arquitectura",
    "panorámica",
    "inmobiliaria",
    "MIESGROUP",
  ],
  authors: [{ name: "NEXARQ 360" }],
  icons: {
    icon: [
      { url: assetPath("/favicon.svg"), type: "image/svg+xml" },
      { url: assetPath("/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: assetPath("/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
      { url: assetPath("/favicon.ico"), sizes: "any" },
    ],
    apple: [{ url: assetPath("/apple-touch-icon.png"), sizes: "180x180" }],
  },
  openGraph: {
    title: "Reserva de Mirriñao | Recorrido Virtual 360°",
    description:
      "Explora la Casa Grande de Reserva de Mirriñao — Constructora Meléndez con tecnología panorámica interactiva 360°.",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Reserva de Mirriñao — Constructora Meléndez",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reserva de Mirriñao | Recorrido Virtual 360°",
    description: "Explora la Casa Grande de Reserva de Mirriñao con tecnología panorámica interactiva 360°.",
    images: [OG_IMAGE],
  },
};

// ─── JSON-LD (schema.org) ──────────────────────────────────────────────────
// Datos estructurados para SEO. Se arma desde metadata.ts. Los campos de
// dirección vacíos se omiten hasta que el cliente confirme la dirección real;
// el bloque `address` solo aparece cuando hay al menos un campo de calle/ciudad.
function buildJsonLd() {
  const { schema, ogImage } = mirrinaoMetadata;
  const { addressCountry, ...streetFields } = schema.address;
  const hasAddress = Object.values(streetFields).some((v) => v !== "");

  return {
    "@context": "https://schema.org",
    "@type": schema.type,
    name: schema.name,
    image: ogImage,
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...Object.fromEntries(
              Object.entries(schema.address).filter(
                ([key, value]) => key === "addressCountry" || value !== "",
              ),
            ),
          },
        }
      : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-black text-white overflow-hidden`}
        style={{ margin: 0, padding: 0, width: "100vw", height: "100vh" }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
