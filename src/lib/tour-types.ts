// ─── Theme Configuration ──────────────────────────────────────────────
export interface ThemeConfig {
  primary: string;
  secondary: string;
  panelBg: string;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  fontFamily: string;
}

// ─── Hotspot ──────────────────────────────────────────────────────────
export interface HotspotConfig {
  id: string;
  pitch: number;
  yaw: number;
  type: 'scene' | 'info' | 'url';
  label: string;
  description?: string;
  targetSceneId?: string;
  url?: string;
}

// ─── Scene ────────────────────────────────────────────────────────────
// Variante visual de una escena (mismo cuarto, distinto amueblado/uso).
// Ej: "Espacio Multiple" puede verse como alcoba o como estudio.
// Si la escena tiene variants[], se muestra un boton flotante para alternar.
export interface SceneVariantConfig {
  id: string;
  label: string;
  /** Panorama de la variante (opcional si linkSceneId esta presente). */
  panorama?: string;
  thumbnail?: string;
  defaultView?: {
    pitch: number;
    yaw: number;
    hfov: number;
  };
  /** Si esta presente, al activar esta variante se NAVEGA a esa escena
   * en lugar de cambiar la variante localmente. Util cuando el "render
   * alternativo" en realidad corresponde fisicamente a otro cuarto. */
  linkSceneId?: string;
  /** Variante a activar automaticamente en la escena destino (opcional). */
  linkVariantId?: string;
}

// Animación de cámara para el modo reproducción.
// La cámara arranca en `from` y viaja suavemente hasta `to` en 6.5s.
export interface PlaybackAnimation {
  from: { pitch: number; yaw: number };
  to:   { pitch: number; yaw: number };
}

export interface SceneConfig {
  id: string;
  name: string;
  panorama: string;
  description: string;
  thumbnail?: string;
  defaultView: {
    pitch: number;
    yaw: number;
    hfov: number;
  };
  hotspots: HotspotConfig[];
  /** Variantes opcionales para alternar el render del cuarto (ej. alcoba vs estudio) */
  variants?: SceneVariantConfig[];
  /** Posicion del boton de cambio de variante DENTRO del panorama (pitch/yaw).
   * Solo se renderiza si la escena tiene variants[]. */
  variantButton?: { pitch: number; yaw: number };
  /** Animaciones para el modo reproducción. Se elige una aleatoriamente. */
  playbackAnimations?: PlaybackAnimation[];
}

// ─── Floor Plan Room ─────────────────────────────────────────────────
export interface FloorPlanRoomConfig {
  id: string;
  sceneId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  /** Posicion % horizontal del radar sobre imagen real (0-100) */
  dotX?: number;
  /** Posicion % vertical del radar sobre imagen real (0-100) */
  dotY?: number;
  /**
   * Offset (grados) entre el yaw=0 del panorama de esta escena y el "arriba"
   * del plano. Se suma al viewerYaw para orientar el cono del radar.
   * Calibrar en ?debug=1 con las teclas [ y ] (Shift = ±5°).
   */
  radarOffset?: number;
  /**
   * Variante de la escena que abre esta burbuja (p. ej. 'obra-gris'). Si se
   * define, la burbuja solo se marca como activa al ver esa variante y al
   * hacer click cambia a ella. Si se omite, representa la vista amueblada.
   */
  variantId?: string;
  adjacentTo?: string[];
}

// ─── Floor Plan ───────────────────────────────────────────────────────
export interface FloorPlanConfig {
  width: number;
  height: number;
  background: string;
  /** URL de imagen real de planta (activa el modo imagen de fondo) */
  backgroundImage?: string;
  rooms: FloorPlanRoomConfig[];
}

// ─── Brand Config ─────────────────────────────────────────────────────
export interface BrandConfig {
  name: string;
  tagline: string;
  logo: string;
  website?: string;
}

// ─── Apartment ────────────────────────────────────────────────────────
export interface ApartmentConfig {
  /** Unique apartment ID */
  id: string;
  /** Display name (e.g. "Apto 101") */
  name: string;
  /** Short description */
  description: string;
  /** Floor number (for building visualization) */
  floor: number;
  /** Position index on the floor (0-based, left to right) */
  position: number;
  /** Number of bedrooms */
  bedrooms: number;
  /** Number of bathrooms */
  bathrooms: number;
  /** Area in m² */
  area: number;
  /** Optional hotspot position override (% of building image) */
  hotspotX?: number;
  hotspotY?: number;
  /**
   * Indica explicitamente si el apartamento esta disponible para recorrer.
   * false = mostrar como "Proximamente" en el selector y sidebar.
   * Si se omite, se determina automaticamente segun las escenas.
   */
  available?: boolean;
  /** Scenes for this apartment */
  scenes: SceneConfig[];
  /** Floor plan for this apartment */
  floorPlan: FloorPlanConfig;
}

// ─── Building ─────────────────────────────────────────────────────────
export interface BuildingConfig {
  /** Unique building ID */
  id: string;
  /** Display name (e.g. "Torre A") */
  name: string;
  /** Number of floors */
  floors: number;
  /** Apartments per floor */
  apartmentsPerFloor: number;
  /** List of apartments */
  apartments: ApartmentConfig[];
}

// ─── Tour Config (ROOT) ──────────────────────────────────────────────
// ─── Galeria / Plantas ────────────────────────────────────────────────
export interface GalleryImageConfig {
  id: string;
  src: string;
  title?: string;
  caption?: string;
}

export interface TourConfig {
  brand: BrandConfig;
  theme: ThemeConfig;
  /** Buildings with apartments */
  buildings: BuildingConfig[];
  /** Auto-rotate speed (0 = off, negative = clockwise) */
  autoRotateSpeed: number;
  /** Show floor plan by default */
  showFloorPlan: boolean;
  /** Show welcome screen on load */
  showWelcome: boolean;
  /** Renders del proyecto (gimnasio, piscina, fachada, etc) */
  gallery?: GalleryImageConfig[];
  /** Plantas arquitectonicas del proyecto (sin burbujas) */
  plantas?: GalleryImageConfig[];
}
