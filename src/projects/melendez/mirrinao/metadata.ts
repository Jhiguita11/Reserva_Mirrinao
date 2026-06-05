// ─── Metadata SEO del proyecto Reserva de Mirriñao ─────────────────────────
// Este archivo alimenta el layout.tsx cuando se activa este proyecto.
// Actualiza los valores cuando se defina el dominio y el contenido final.

export const mirrinaoMetadata = {
  // ─── Datos del proyecto ──────────────────────────────────────────────────
  projectName: 'Reserva de Mirriñao',
  constructora: 'Constructora Meléndez',
  agency: 'MIESGROUP',

  // ─── SEO ─────────────────────────────────────────────────────────────────
  title: 'Reserva de Mirriñao | Recorrido Virtual 360° | Constructora Meléndez',
  description:
    'Explora la Casa Grande de Reserva de Mirriñao con tecnología de recorrido virtual 360°. ' +
    'Casa medianera de 2 pisos · 3 alcobas · 2 baños · patio. Constructora Meléndez.',
  keywords: [
    'Reserva de Mirriñao',
    'Mirriñao',
    'Constructora Meléndez',
    'recorrido virtual 360',
    'casa medianera',
    'casas nuevas',
    'tour virtual arquitectónico',
    'inmobiliaria',
    'MIESGROUP',
  ],

  // ─── Open Graph / Social ─────────────────────────────────────────────────
  // ogImage: imagen preview para redes (1200×630). Exterior real de la Casa Grande.
  ogImage: '/projects/melendez/mirrinao/images/exterior/building.jpg',
  ogType: 'website' as const,

  // ─── Schema markup ───────────────────────────────────────────────────────
  // Para uso futuro con JSON-LD (RealEstate, LocalBusiness, etc.)
  schema: {
    type: 'RealEstateAgent',
    name: 'Reserva de Mirriñao — Constructora Meléndez',
    address: {
      // ACTUALIZAR: dirección real del proyecto (pendiente de confirmar con el cliente)
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      addressCountry: 'CO',
    },
  },
};
