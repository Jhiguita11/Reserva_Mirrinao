import { TourConfig } from '@/lib/tour-types';
import { assetPath } from '@/lib/asset-path';

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  TEMPLATE DE PROYECTO — NEXARQ 360 / MIESGROUP                      ║
// ║                                                                      ║
// ║  PASOS PARA CREAR UN PROYECTO NUEVO:                                 ║
// ║                                                                      ║
// ║  1. Copia esta carpeta a:                                            ║
// ║       src/projects/<constructora>/<proyecto>/                        ║
// ║                                                                      ║
// ║  2. Copia los assets a:                                              ║
// ║       public/projects/<constructora>/<proyecto>/                     ║
// ║     (usa la carpeta public/projects/_template/ como referencia)      ║
// ║                                                                      ║
// ║  3. Reemplaza CONSTRUCTORA y PROYECTO con los valores reales         ║
// ║                                                                      ║
// ║  4. Actualiza brand, theme, buildings, scenes y floorPlan            ║
// ║                                                                      ║
// ║  5. Activa el proyecto en src/lib/tour-store.ts:                     ║
// ║       import tourConfig from '@/projects/<c>/<p>/tour.config';       ║
// ║                                                                      ║
// ║  REFERENCIA REAL: src/projects/melendez/valle-alto/tour.config.ts    ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ─── PASO 1: Cambiar estos dos valores ───────────────────────────────────
const CONSTRUCTORA = '_constructora_';    // ej: 'melendez', 'ospinas', 'amarilo'
const PROYECTO     = '_proyecto_';        // ej: 'valle-alto', 'san-pablo', 'reserva'

// ─── Rutas base de assets ────────────────────────────────────────────────
// Modo un solo tour:
const PANO  = (path: string) => assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/panoramas/${path}`);
// Modo multi-tour (dos tipologías):
// const PANO_A = (path: string) => assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/panoramas/tipo-a/${path}`);
// const PANO_B = (path: string) => assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/panoramas/tipo-b/${path}`);

const BRAND = (path: string) => assetPath(`/projects/${CONSTRUCTORA}/branding/${path}`);
const PLAN  = (path: string) => assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/floor-plans/${path}`);

// ─────────────────────────────────────────────────────────────────────────
//  MODO UN SOLO TOUR (una tipología de apartamento)
// ─────────────────────────────────────────────────────────────────────────
const templateConfig: TourConfig = {

  // ─── Marca del proyecto ─────────────────────────────────────────────
  // Cambiar: nombre, tagline, logo y URL de la constructora
  brand: {
    name: '_NOMBRE DEL PROYECTO_',           // ej: 'Valle Alto'
    tagline: '_NOMBRE DE LA CONSTRUCTORA_',  // ej: 'Constructora Melendez'
    logo: BRAND('LogoProyectoSinFondo.png'),
    website: 'https://www.constructora.com',
  },

  // ─── Tema visual ─────────────────────────────────────────────────────
  // Cambiar los colores según la paleta de marca del proyecto.
  // primary: color principal de los hotspots y acentos
  // panelBg: fondo semitransparente de paneles (rgba con alpha ~0.90)
  theme: {
    primary: '#D4AF37',                           // Dorado NEXARQ por defecto
    secondary: '#B8962E',
    panelBg: 'rgba(0, 0, 0, 0.80)',
    textPrimary: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(212, 175, 55, 0.15)',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  // ─── Edificios y apartamentos ─────────────────────────────────────────
  buildings: [
    {
      id: PROYECTO,
      name: '_NOMBRE DEL EDIFICIO_',   // ej: 'Torre A' o nombre del proyecto
      floors: 1,                        // ACTUALIZAR: número de pisos
      apartmentsPerFloor: 1,            // ACTUALIZAR: aptos por piso
      apartments: [
        {
          id: `${PROYECTO}-apto-101`,
          name: 'Apartamento Tipo A',
          description: 'Sala · Cocina · Alcoba Principal · Baño',
          floor: 0,
          position: 0,
          bedrooms: 2,
          bathrooms: 1,
          area: 60,           // Área en m²

          // ─── Escenas del recorrido ──────────────────────────────────
          // Cada escena es un panorama 360° con sus hotspots de navegación.
          // Los hotspots usan coordenadas pitch/yaw (grados):
          //   pitch: vertical (-90=abajo, 0=horizonte, 90=arriba)
          //   yaw:   horizontal (-180 a 180, 0=frente del panorama)
          // Calibrar con ?debug=1 en la URL del visor.
          scenes: [

            // ─── ESCENA: SALA ──────────────────────────────────────────
            {
              id: `${PROYECTO}-sala`,
              name: 'Sala',
              description: 'Sala y comedor',
              panorama: PANO('sala.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                // Ejemplo de hotspot de navegación a otra escena:
                {
                  id: `${PROYECTO}-sala-to-cocina`,
                  pitch: 0,
                  yaw: 90,          // Ajustar tras calibrar con ?debug=1
                  type: 'scene',
                  label: 'Cocina',
                  description: 'Ir a la cocina',
                  targetSceneId: `${PROYECTO}-cocina`,
                },
              ],
            },

            // ─── ESCENA: COCINA ────────────────────────────────────────
            {
              id: `${PROYECTO}-cocina`,
              name: 'Cocina',
              description: 'Cocina integral',
              panorama: PANO('cocina.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                {
                  id: `${PROYECTO}-cocina-to-sala`,
                  pitch: 0,
                  yaw: -90,         // Ajustar
                  type: 'scene',
                  label: 'Sala',
                  description: 'Volver a la sala',
                  targetSceneId: `${PROYECTO}-sala`,
                },
              ],
            },

            // Agregar más escenas aquí siguiendo el mismo patrón...
            // Escenas típicas: acceso, sala, cocina, alcoba-principal,
            // alcoba-auxiliar, bano, balcon, estudio
          ],

          // ─── Plano de planta ──────────────────────────────────────────
          // Opción A: Plano geométrico (sin imagen de fondo)
          // Opción B: Imagen real del plano (recomendado) — ver tour Tipo B de Valle Alto
          floorPlan: {
            width: 300,
            height: 200,
            background: 'rgba(0, 0, 0, 0.6)',
            // Para usar imagen real del plano, agregar:
            // backgroundImage: PLAN('nombre-del-plano.jpg'),
            rooms: [
              {
                id: `fp-${PROYECTO}-sala`,
                sceneId: `${PROYECTO}-sala`,
                label: 'Sala',
                // Coordenadas en px dentro del canvas width×height
                x: 10, y: 10, width: 100, height: 100,
                // Para modo imagen: dotX/dotY en % del área de la imagen (0-100)
                // dotX: 45.2, dotY: 38.7,
                fill: 'rgba(255,255,255,0.08)',
                stroke: 'rgba(255,255,255,0.2)',
                adjacentTo: [`${PROYECTO}-cocina`],
              },
              {
                id: `fp-${PROYECTO}-cocina`,
                sceneId: `${PROYECTO}-cocina`,
                label: 'Cocina',
                x: 120, y: 10, width: 80, height: 60,
                fill: 'rgba(255,255,255,0.08)',
                stroke: 'rgba(255,255,255,0.2)',
                adjacentTo: [`${PROYECTO}-sala`],
              },
            ],
          },
        },
      ],
    },
  ],

  autoRotateSpeed: -0.5,    // 0 para desactivar. Negativo = sentido horario
  showFloorPlan: true,
  showWelcome: true,

  // ─── Galería de renders (zonas comunes) ──────────────────────────────
  // Descomentar y completar cuando lleguen los renders del cliente.
  gallery: [
    // { id: 'gym',   src: assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/images/renders/gimnasio.jpg`),  title: 'Gimnasio' },
    // { id: 'pool',  src: assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/images/renders/piscina.jpg`),   title: 'Piscina' },
    // { id: 'lobby', src: assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/images/renders/lobby.jpg`),     title: 'Lobby' },
  ],

  // ─── Plantas arquitectónicas ────────────────────────────────────────
  // Descomentar cuando lleguen las plantas limpias (sin burbujas).
  plantas: [
    // {
    //   id: 'planta-tipo-a',
    //   src: assetPath(`/projects/${CONSTRUCTORA}/${PROYECTO}/floor-plans/plano-tipo-a.jpg`),
    //   title: 'Apartamento Tipo A',
    //   caption: 'Área construida XX m² · Área privada XX m²',
    // },
  ],
};

export default templateConfig;


// ─────────────────────────────────────────────────────────────────────────
//  MODO MULTI-TOUR (dos tipologías de apartamento: Tipo A y Tipo B)
//
//  Descomenta este bloque, borra el templateConfig de arriba, y activa
//  PANO_A / PANO_B en lugar de PANO.
//
//  Ver implementación real en:
//    src/projects/melendez/valle-alto/tour.config.ts
// ─────────────────────────────────────────────────────────────────────────

/*

const sharedBrand = {
  name: '_NOMBRE DEL PROYECTO_',
  tagline: '_NOMBRE DE LA CONSTRUCTORA_',
  logo: BRAND('LogoProyectoSinFondo.png'),
  website: 'https://www.constructora.com',
};

const sharedTheme = {
  primary: '#D4AF37',
  secondary: '#B8962E',
  panelBg: 'rgba(0, 0, 0, 0.80)',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  borderColor: 'rgba(212, 175, 55, 0.15)',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

// ─── Tour Tipo A ────────────────────────────────────────────────────────
export const templateTipoA: TourConfig = {
  brand: sharedBrand,
  theme: sharedTheme,
  buildings: [
    {
      id: PROYECTO,
      name: '_NOMBRE DEL PROYECTO_',
      floors: 1,
      apartmentsPerFloor: 1,
      apartments: [
        {
          id: `${PROYECTO}-tipo-a`,
          name: 'Apartamento Tipo A',
          description: 'Sala · Cocina · Alcoba Principal · Baño · Balcón',
          floor: 0,
          position: 0,
          bedrooms: 2,
          bathrooms: 2,
          area: 72,
          scenes: [
            {
              id: `${PROYECTO}-ta-sala`,
              name: 'Sala',
              description: 'Sala principal',
              panorama: PANO_A('sala.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [],
            },
            // Agregar más escenas...
          ],
          floorPlan: {
            width: 300,
            height: 200,
            background: 'rgba(0, 0, 0, 0.6)',
            rooms: [
              {
                id: `fp-${PROYECTO}-ta-sala`,
                sceneId: `${PROYECTO}-ta-sala`,
                label: 'Sala',
                x: 10, y: 10, width: 100, height: 100,
                fill: 'rgba(255,255,255,0.08)',
                stroke: 'rgba(255,255,255,0.2)',
                adjacentTo: [],
              },
            ],
          },
        },
      ],
    },
  ],
  autoRotateSpeed: -0.5,
  showFloorPlan: true,
  showWelcome: true,
};

// ─── Tour Tipo B ────────────────────────────────────────────────────────
export const templateTipoB: TourConfig = {
  brand: sharedBrand,
  theme: sharedTheme,
  buildings: [
    {
      id: PROYECTO,
      name: '_NOMBRE DEL PROYECTO_',
      floors: 1,
      apartmentsPerFloor: 1,
      apartments: [
        {
          id: `${PROYECTO}-tipo-b`,
          name: 'Apartamento Tipo B',
          description: 'Sala · Cocina · Alcoba Principal · Baño',
          floor: 0,
          position: 1,
          bedrooms: 2,
          bathrooms: 1,
          area: 60,
          scenes: [
            {
              id: `${PROYECTO}-tb-sala`,
              name: 'Sala',
              description: 'Sala principal',
              panorama: PANO_B('sala.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [],
            },
            // Agregar más escenas...
          ],
          floorPlan: {
            width: 300,
            height: 200,
            background: 'rgba(0, 0, 0, 0.6)',
            rooms: [
              {
                id: `fp-${PROYECTO}-tb-sala`,
                sceneId: `${PROYECTO}-tb-sala`,
                label: 'Sala',
                x: 10, y: 10, width: 100, height: 100,
                fill: 'rgba(255,255,255,0.08)',
                stroke: 'rgba(255,255,255,0.2)',
                adjacentTo: [],
              },
            ],
          },
        },
      ],
    },
  ],
  autoRotateSpeed: -0.5,
  showFloorPlan: true,
  showWelcome: true,
};

// ─── Config combinado: ambas tipologías en un selector ────────────────
// Este es el export por defecto — muestra Tipo A y Tipo B en el selector.
const templateCombinado: TourConfig = {
  brand: sharedBrand,
  theme: sharedTheme,
  buildings: [
    {
      id: PROYECTO,
      name: '_NOMBRE DEL PROYECTO_',
      floors: 1,
      apartmentsPerFloor: 2,
      apartments: [
        ...templateTipoA.buildings[0].apartments,
        ...templateTipoB.buildings[0].apartments,
      ],
    },
  ],
  autoRotateSpeed: -0.5,
  showFloorPlan: true,
  showWelcome: true,
  gallery: [],
  plantas: [],
};

export default templateCombinado;

*/
