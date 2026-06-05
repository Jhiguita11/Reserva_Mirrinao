import { TourConfig } from '@/lib/tour-types';
import { assetPath } from '@/lib/asset-path';

// ============================================================
//  MIRRIÑAO — CASA GRANDE — CONSTRUCTORA MELÉNDEZ
//  Producido por MIESGROUP para Constructora Meléndez
//
//  Vivienda "Casa Medianera" de DOS PISOS (89 m² const. / 67 m² priv.)
//  con 10 espacios fotografiados en 360°.
//
//  PRIMER PISO (zona social, planta abierta):
//    Acceso · Sala · Comedor · Cocina + Patio de ropas · Patio Exterior
//  SEGUNDO PISO (zona privada, hall central):
//    Alcoba Principal · Alcoba Auxiliar 1 · Alcoba Auxiliar 2
//    Baño Principal (suite) · Baño Social
//  Los pisos se conectan por la escalera (hotspots Sala ⇄ Alcoba Principal).
//
//  OBRA GRIS (variante en 5 escenas):
//    Sala · Cocina+Patio · Alcoba Principal · Baño Social · Patio Exterior
//
//  ─── CALIBRACIÓN ───────────────────────────────────────────
//  Los pitch/yaw de hotspots son una PRIMERA PASADA estimada a partir
//  de la posición de cada puerta en las equirectangulares. Afinar con
//  ?debug=1 (crosshair + exportar escena). El floorPlan ya usa la planta
//  real combinada y los dotX/dotY están sobre las burbujas impresas;
//  ajustarlos arrastrándolos en el modo debug del floor plan.
// ============================================================

// --- Rutas base de assets ---
const PANO = (path: string) => assetPath(`/projects/melendez/mirrinao/panoramas/casa-grande/${path}`);
const GRIS = (path: string) => assetPath(`/projects/melendez/mirrinao/panoramas/casa-grande/obra-gris/${path}`);
const PLAN  = (path: string) => assetPath(`/projects/melendez/mirrinao/floor-plans/${path}`);

// --- Bloque de marca ---
// Logo oficial "Reserva de Mirriñao" (vertical a color, fondo transparente).
const brand = {
  name: 'Reserva de Mirriñao',
  tagline: 'Constructora Meléndez',
  logo: assetPath('/projects/melendez/mirrinao/branding/logo-vertical-color.png'),
  website: 'https://www.constructoramelendez.com',
};

// --- Tema visual ---
// Paleta tierra de marca (02_Branding/Logos/Paleta de color.png):
//   mostaza #CB9415 · caramelo #8E6849 · olivo #6D6C3C · salvia #A5A276
//   marrón #4B2C10 · crema #FFF9E9
const theme = {
  primary: '#8E6849',                       // caramelo — acento principal
  secondary: '#CB9415',                     // mostaza — acento secundario
  panelBg: 'rgba(36, 24, 12, 0.92)',        // marrón cálido para paneles
  textPrimary: '#FFF9E9',                   // crema — texto principal
  textMuted: 'rgba(255, 249, 233, 0.50)',   // crema atenuado
  borderColor: 'rgba(203, 148, 21, 0.18)',  // mostaza translúcido
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

// Variante "Obra gris" reutilizable: la escena muestra el render amueblado
// por defecto y permite alternar al render en obra gris del mismo cuarto.
const obraGrisVariants = (file: string) => [
  { id: 'amueblado', label: 'Amueblado', panorama: PANO(file) },
  { id: 'obra-gris', label: 'Obra gris', panorama: GRIS(file) },
];

const mirrinao: TourConfig = {
  brand,
  theme,

  buildings: [
    {
      id: 'mirrinao',
      name: 'MIRRIÑAO',
      floors: 2,
      apartmentsPerFloor: 1,

      apartments: [
        {
          id: 'cg-casa-grande',
          name: 'Casa Grande',
          description: 'Casa de 2 pisos · 3 Alcobas · 2 Baños · Patio',
          floor: 0,
          position: 0,
          bedrooms: 3,
          bathrooms: 2,
          // ACTUALIZAR: confirmar área real (plano indica 89 m² const. / 67 m² priv.)
          area: 89,
          available: true,
          // Posición del hotspot sobre el render exterior (public/building.png),
          // alineada con la burbuja "Casa Medianera" del entregable (06_ImagenInicio).
          hotspotX: 52,
          hotspotY: 49,

          scenes: [

            // ══════════════ PRIMER PISO ══════════════

            // --- ESCENA: ACCESO ---
            {
              id: 'cg-acceso',
              name: 'Acceso',
              description: 'Hall de entrada',
              panorama: PANO('acceso.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                { id: 'cg-acc-to-sala',    pitch: -1.9, yaw: -102.2, type: 'scene', label: 'Sala',           description: 'Ir a la sala',    targetSceneId: 'cg-sala' },
                { id: 'cg-acc-to-comedor', pitch: -2.9, yaw: -72.1,  type: 'scene', label: 'Comedor',        description: 'Ir al comedor',   targetSceneId: 'cg-comedor' },
                { id: 'cg-acc-to-patio',   pitch: -0.3, yaw: -90.9,  type: 'scene', label: 'Patio Exterior', description: 'Salir al patio',  targetSceneId: 'cg-patio-exterior' },
              ],
            },

            // --- ESCENA: SALA --- (hub social + escalera al 2º piso)
            {
              id: 'cg-sala',
              name: 'Sala',
              description: 'Sala de estar',
              panorama: PANO('sala.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              variants: obraGrisVariants('sala.jpg'),
              variantButton: { pitch: 0, yaw: 120 },
              hotspots: [
                { id: 'cg-sala-to-acceso',  pitch: -1.3, yaw: 76.5,  type: 'scene', label: 'Acceso',         description: 'Volver al acceso',     targetSceneId: 'cg-acceso' },
                { id: 'cg-sala-to-comedor', pitch: -0.2, yaw: 2.4,   type: 'scene', label: 'Comedor',        description: 'Ir al comedor',        targetSceneId: 'cg-comedor' },
                { id: 'cg-sala-to-2piso',   pitch: -9.8, yaw: 85.3,  type: 'scene', label: 'Segundo Piso',   description: 'Subir al segundo piso', targetSceneId: 'cg-bano-social' },
                { id: 'cg-sala-to-patio',   pitch: -5.7, yaw: -71.6, type: 'scene', label: 'Patio Exterior', description: 'Salir al patio',       targetSceneId: 'cg-patio-exterior' },
              ],
            },

            // --- ESCENA: COMEDOR ---
            {
              id: 'cg-comedor',
              name: 'Comedor',
              description: 'Comedor',
              panorama: PANO('comedor.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                { id: 'cg-com-to-cocina', pitch: 0.7,  yaw: 88.3,  type: 'scene', label: 'Cocina y Patio', description: 'Ir a la cocina',       targetSceneId: 'cg-cocina-patio' },
                { id: 'cg-com-to-2piso',  pitch: 0.6,  yaw: 121.8, type: 'scene', label: 'Segundo Piso',   description: 'Subir al segundo piso', targetSceneId: 'cg-bano-social' },
                { id: 'cg-com-to-sala',   pitch: -1.6, yaw: 162.6, type: 'scene', label: 'Sala',           description: 'Volver a la sala',     targetSceneId: 'cg-sala' },
                { id: 'cg-com-to-acceso', pitch: -0.9, yaw: 102.2, type: 'scene', label: 'Acceso',         description: 'Ir al acceso',         targetSceneId: 'cg-acceso' },
              ],
            },

            // --- ESCENA: COCINA + PATIO DE ROPAS ---
            {
              id: 'cg-cocina-patio',
              name: 'Cocina y Patio',
              description: 'Cocina integral con patio de ropas',
              panorama: PANO('cocina-patio.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              variants: obraGrisVariants('cocina-patio.jpg'),
              variantButton: { pitch: 2.1, yaw: 84.7 },
              hotspots: [
                { id: 'cg-coc-to-comedor', pitch: -1.2, yaw: -86.6, type: 'scene', label: 'Comedor', description: 'Volver al comedor', targetSceneId: 'cg-comedor' },
              ],
            },

            // --- ESCENA: PATIO EXTERIOR ---
            {
              id: 'cg-patio-exterior',
              name: 'Patio Exterior',
              description: 'Patio con zona de asador',
              panorama: PANO('patio-exterior.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              variants: obraGrisVariants('patio-exterior.jpg'),
              variantButton: { pitch: -1.3, yaw: 33 },
              hotspots: [
                { id: 'cg-patio-to-sala', pitch: -2.2, yaw: 110.4, type: 'scene', label: 'Sala', description: 'Volver a la sala', targetSceneId: 'cg-sala' },
              ],
            },

            // ══════════════ SEGUNDO PISO ══════════════

            // --- ESCENA: ALCOBA PRINCIPAL --- (hub privado del 2º piso)
            {
              id: 'cg-alcoba-principal',
              name: 'Alcoba Principal',
              description: 'Alcoba principal con baño privado',
              panorama: PANO('alcoba-principal.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              variants: obraGrisVariants('alcoba-principal.jpg'),
              variantButton: { pitch: 0, yaw: 120 },
              hotspots: [
                { id: 'cg-alc-ppal-to-bsoc', pitch: -1.1, yaw: -62.1, type: 'scene', label: 'Baño Social',      description: 'Ir al baño social',         targetSceneId: 'cg-bano-social' },
                { id: 'cg-alc-ppal-to-bano', pitch: -0.8, yaw: 77.6,  type: 'scene', label: 'Baño Principal',   description: 'Ir al baño',                targetSceneId: 'cg-bano-principal' },
                { id: 'cg-alc-ppal-to-aux2', pitch: -2.4, yaw: -78.5, type: 'scene', label: 'Alcoba Auxiliar 2', description: 'Ir a la alcoba auxiliar 2', targetSceneId: 'cg-alcoba-auxiliar-2' },
                { id: 'cg-alc-ppal-to-aux1', pitch: -2.2, yaw: -95.7, type: 'scene', label: 'Alcoba Auxiliar 1', description: 'Ir a la alcoba auxiliar 1', targetSceneId: 'cg-alcoba-auxiliar-1' },
              ],
            },

            // --- ESCENA: BAÑO PRINCIPAL (suite) ---
            {
              id: 'cg-bano-principal',
              name: 'Baño Principal',
              description: 'Baño privado de la alcoba principal',
              panorama: PANO('bano-principal.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                { id: 'cg-bano-ppal-to-alc', pitch: -3, yaw: 170, type: 'scene', label: 'Alcoba Principal', description: 'Volver a la alcoba', targetSceneId: 'cg-alcoba-principal' },
              ],
            },

            // --- ESCENA: ALCOBA AUXILIAR 1 ---
            {
              id: 'cg-alcoba-auxiliar-1',
              name: 'Alcoba Auxiliar 1',
              description: 'Segunda alcoba',
              panorama: PANO('alcoba-auxiliar-1.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                { id: 'cg-aux1-to-ppal', pitch: -1.1, yaw: 77.8, type: 'scene', label: 'Alcoba Principal', description: 'Ir a la alcoba principal', targetSceneId: 'cg-alcoba-principal' },
                { id: 'cg-aux1-to-bsoc', pitch: -1.7, yaw: 57.5, type: 'scene', label: 'Baño Social',      description: 'Ir al baño social',        targetSceneId: 'cg-bano-social' },
              ],
            },

            // --- ESCENA: ALCOBA AUXILIAR 2 ---
            {
              id: 'cg-alcoba-auxiliar-2',
              name: 'Alcoba Auxiliar 2',
              description: 'Tercera alcoba',
              panorama: PANO('alcoba-auxiliar-2.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              hotspots: [
                { id: 'cg-aux2-to-bsoc', pitch: -0.7, yaw: 62.7, type: 'scene', label: 'Baño Social',      description: 'Ir al baño social',        targetSceneId: 'cg-bano-social' },
                { id: 'cg-aux2-to-ppal', pitch: -0.4, yaw: 84.4, type: 'scene', label: 'Alcoba Principal', description: 'Ir a la alcoba principal', targetSceneId: 'cg-alcoba-principal' },
              ],
            },

            // --- ESCENA: BAÑO SOCIAL --- (hub del 2º piso + escalera al 1er piso)
            {
              id: 'cg-bano-social',
              name: 'Baño Social',
              description: 'Baño del hall de alcobas',
              panorama: PANO('bano-social.jpg'),
              defaultView: { pitch: 0, yaw: 0, hfov: 100 },
              variants: obraGrisVariants('bano-social.jpg'),
              variantButton: { pitch: 6.7, yaw: 159.9 },
              hotspots: [
                { id: 'cg-bsoc-to-ppal',  pitch: -0.8,  yaw: 117.1,  type: 'scene', label: 'Alcoba Principal',  description: 'Ir a la alcoba principal', targetSceneId: 'cg-alcoba-principal' },
                { id: 'cg-bsoc-to-aux2',  pitch: -2.2,  yaw: -115.2, type: 'scene', label: 'Alcoba Auxiliar 2', description: 'Ir a la alcoba auxiliar 2', targetSceneId: 'cg-alcoba-auxiliar-2' },
                { id: 'cg-bsoc-to-aux1',  pitch: -2.7,  yaw: -157.9, type: 'scene', label: 'Alcoba Auxiliar 1', description: 'Ir a la alcoba auxiliar 1', targetSceneId: 'cg-alcoba-auxiliar-1' },
                { id: 'cg-bsoc-to-1piso', pitch: -21.6, yaw: 141.1,  type: 'scene', label: 'Primer Piso',       description: 'Bajar al primer piso',     targetSceneId: 'cg-sala' },
              ],
            },

          ],

          // --- PLANO DE PLANTA (dos pisos combinados) ---
          // Fondo: planta real Primer Piso | Segundo Piso (floor-plans/planta-casa-grande.jpg).
          // dotX/dotY en % sobre la imagen, posicionados sobre las burbujas impresas.
          // Afinar arrastrando en el floor plan con ?debug=1.
          floorPlan: {
            width: 2100,
            height: 1460,
            background: 'transparent',
            backgroundImage: PLAN('planta-casa-grande.jpg'),
            rooms: [
              // ── Primer piso (mitad izquierda) ──
              // dotX/dotY: detectados de los puntos cian impresos en el plano.
              // radarOffset: estimado inicial (calculado). Afinar en ?debug=1 con [ ].
              { id: 'fp-cg-acceso',   sceneId: 'cg-acceso',           label: 'Acceso',            x: 503,  y: 879,  width: 170, height: 170, dotX: 19.4, dotY: 52.7, radarOffset: 80,  adjacentTo: ['cg-sala', 'cg-comedor', 'cg-patio-exterior'] },
              { id: 'fp-cg-sala',     sceneId: 'cg-sala',             label: 'Sala',              x: 587,  y: 470,  width: 170, height: 170, dotX: 16.4, dotY: 38.3, radarOffset: 65,  adjacentTo: ['cg-acceso', 'cg-comedor', 'cg-patio-exterior', 'cg-bano-social'] },
              { id: 'fp-cg-comedor',  sceneId: 'cg-comedor',          label: 'Comedor',           x: 398,  y: 441,  width: 170, height: 170, dotX: 21.8, dotY: 33.9, radarOffset: 64,  adjacentTo: ['cg-acceso', 'cg-sala', 'cg-cocina-patio', 'cg-bano-social'] },
              { id: 'fp-cg-cocina',   sceneId: 'cg-cocina-patio',     label: 'Cocina y Patio',    x: 293,  y: 674,  width: 170, height: 170, dotX: 22.8, dotY: 68.6, radarOffset: 112, adjacentTo: ['cg-comedor'] },
              { id: 'fp-cg-patio',    sceneId: 'cg-patio-exterior',   label: 'Patio Exterior',    x: 272,  y: 251,  width: 170, height: 170, dotX: 17.7, dotY: 23.5, radarOffset: 13,  adjacentTo: ['cg-acceso', 'cg-sala'] },
              // Burbujas de OBRA GRIS (variante) — puntos cian extra del plano
              { id: 'fp-cg-sala-gris',   sceneId: 'cg-sala',           label: 'Sala (gris)',           variantId: 'obra-gris', x: 332, y: 549, width: 170, height: 170, dotX: 33.6, dotY: 38.9, radarOffset: 65,  adjacentTo: [] },
              { id: 'fp-cg-cocina-gris', sceneId: 'cg-cocina-patio',   label: 'Cocina y Patio (gris)', variantId: 'obra-gris', x: 456, y: 991, width: 170, height: 170, dotX: 30, dotY: 68.6, radarOffset: 112, adjacentTo: [] },
              { id: 'fp-cg-patio-gris',  sceneId: 'cg-patio-exterior', label: 'Patio Exterior (gris)', variantId: 'obra-gris', x: 720, y: 343, width: 170, height: 170, dotX: 34.3, dotY: 23.5, radarOffset: 13,  adjacentTo: [] },
              // ── Segundo piso (mitad derecha) ──
              { id: 'fp-cg-alc-ppal', sceneId: 'cg-alcoba-principal', label: 'Alcoba Principal',  x: 1238, y: 835,  width: 170, height: 170, dotX: 63.6, dotY: 63.9, radarOffset: 74,  adjacentTo: ['cg-bano-social', 'cg-bano-principal', 'cg-alcoba-auxiliar-1', 'cg-alcoba-auxiliar-2'] },
              { id: 'fp-cg-bano-ppal',sceneId: 'cg-bano-principal',   label: 'Baño Principal',    x: 1364, y: 922,  width: 170, height: 170, dotX: 68.8, dotY: 70.8, radarOffset: 134, adjacentTo: ['cg-alcoba-principal'] },
              { id: 'fp-cg-aux1',     sceneId: 'cg-alcoba-auxiliar-1',label: 'Alcoba Auxiliar 1', x: 1175, y: 455,  width: 170, height: 170, dotX: 61.3, dotY: 38.8, radarOffset: 81,  adjacentTo: ['cg-alcoba-principal', 'cg-bano-social'] },
              { id: 'fp-cg-aux2',     sceneId: 'cg-alcoba-auxiliar-2',label: 'Alcoba Auxiliar 2', x: 1301, y: 455,  width: 170, height: 170, dotX: 66.5, dotY: 38.9, radarOffset: 111, adjacentTo: ['cg-bano-social', 'cg-alcoba-principal'] },
              { id: 'fp-cg-bano-soc', sceneId: 'cg-bano-social',      label: 'Baño Social',       x: 1301, y: 557,  width: 170, height: 170, dotX: 66.3, dotY: 45,   radarOffset: 99,  adjacentTo: ['cg-alcoba-principal', 'cg-alcoba-auxiliar-1', 'cg-alcoba-auxiliar-2', 'cg-sala'] },
              // Burbujas de OBRA GRIS (variante) — puntos cian extra del plano
              { id: 'fp-cg-alc-ppal-gris', sceneId: 'cg-alcoba-principal', label: 'Alcoba Principal (gris)', variantId: 'obra-gris', x: 1686, y: 911, width: 170, height: 170, dotX: 80.3, dotY: 62.4, radarOffset: 74, adjacentTo: [] },
              { id: 'fp-cg-bano-soc-gris', sceneId: 'cg-bano-social',      label: 'Baño Social (gris)',      variantId: 'obra-gris', x: 1686, y: 635, width: 170, height: 170, dotX: 80.3, dotY: 43.5, radarOffset: 99, adjacentTo: [] },
            ],
          },
        },
      ],
    },
  ],

  autoRotateSpeed: -0.5,
  showFloorPlan: true,
  showWelcome: true,

  // ─── Galería de renders ─────────────────────────────────────────────────
  // 5 renders de cámara fija (03_Galeria), optimizados a 2000px.
  gallery: [
    { id: 'sala-comedor', src: assetPath('/projects/melendez/mirrinao/images/renders/sala-comedor.jpg'),     title: 'Sala Comedor',     caption: 'Zona social en planta abierta' },
    { id: 'cocina',       src: assetPath('/projects/melendez/mirrinao/images/renders/cocina.jpg'),           title: 'Cocina',           caption: 'Cocina integral con patio de ropas' },
    { id: 'alcoba-ppal',  src: assetPath('/projects/melendez/mirrinao/images/renders/alcoba-principal.jpg'), title: 'Alcoba Principal', caption: 'Alcoba principal con baño privado' },
    { id: 'alcoba-aux',   src: assetPath('/projects/melendez/mirrinao/images/renders/alcoba-auxiliar.jpg'),  title: 'Alcoba Auxiliar',  caption: 'Alcoba auxiliar' },
    { id: 'bano-ppal',    src: assetPath('/projects/melendez/mirrinao/images/renders/bano-principal.jpg'),   title: 'Baño Principal',   caption: 'Baño de la alcoba principal' },
  ],

  // ─── Plantas arquitectónicas ────────────────────────────────────────────
  plantas: [
    { id: 'plantas-pisos', src: assetPath('/projects/melendez/mirrinao/floor-plans/plantas-pisos.jpg'), title: 'Plantas — Primer y Segundo Piso', caption: 'Área construida 89 m² · Área privada 67 m²' },
  ],
};

export default mirrinao;
