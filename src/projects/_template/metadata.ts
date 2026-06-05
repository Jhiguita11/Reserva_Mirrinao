// ─── Metadata SEO del proyecto ────────────────────────────────────────────
//
// Este archivo alimenta src/app/layout.tsx cuando se activa este proyecto.
// Actualiza todos los campos antes de publicar.
//
// Cómo usar en layout.tsx:
//
//   import { projectMetadata } from '@/projects/<constructora>/<proyecto>/metadata';
//
//   export const metadata: Metadata = {
//     title: projectMetadata.title,
//     description: projectMetadata.description,
//     keywords: projectMetadata.keywords,
//     openGraph: {
//       title: projectMetadata.title,
//       description: projectMetadata.description,
//       type: projectMetadata.ogType,
//       images: [{ url: projectMetadata.ogImage, width: 1200, height: 630 }],
//     },
//     twitter: {
//       card: 'summary_large_image',
//       title: projectMetadata.title,
//       description: projectMetadata.description,
//       images: [projectMetadata.ogImage],
//     },
//   };

export const projectMetadata = {
  // ─── Datos del proyecto ──────────────────────────────────────────────
  projectName: '_NOMBRE DEL PROYECTO_',       // ej: 'Valle Alto'
  constructora: '_NOMBRE DE LA CONSTRUCTORA_', // ej: 'Constructora Melendez'
  agency: 'MIESGROUP',

  // ─── SEO ─────────────────────────────────────────────────────────────
  // title: visible en la pestaña del navegador y en resultados de Google
  // description: resumen de 150-160 caracteres para Google y compartir
  title: '_PROYECTO_ | Recorrido Virtual 360° | _CONSTRUCTORA_',
  description:
    'Explora cada espacio del proyecto _PROYECTO_ con tecnología de recorrido virtual 360°. ' +
    '_CONSTRUCTORA_.',
  keywords: [
    '_PROYECTO_',
    '_CONSTRUCTORA_',
    'recorrido virtual 360',
    'tour virtual arquitectónico',
    'apartamentos nuevos',
    'inmobiliaria',
    'MIESGROUP',
  ],

  // ─── Open Graph / Social ─────────────────────────────────────────────
  // ogImage: imagen de preview para WhatsApp, Facebook, Twitter, etc.
  // Dimensión recomendada: 1200×630 px
  // Debe ser una URL absoluta en producción o relativa al basePath
  ogImage: '/projects/_constructora_/_proyecto_/images/exterior/building.jpg',
  ogType: 'website' as const,

  // ─── Schema.org JSON-LD ──────────────────────────────────────────────
  // Para uso futuro con metadatos estructurados (RealEstate, etc.)
  schema: {
    type: 'RealEstateAgent',
    name: '_PROYECTO_ — _CONSTRUCTORA_',
    address: {
      streetAddress: '',       // ej: 'Cra 5 # 12-34'
      addressLocality: '',     // ej: 'Cali'
      addressRegion: '',       // ej: 'Valle del Cauca'
      addressCountry: 'CO',
    },
  },
};
