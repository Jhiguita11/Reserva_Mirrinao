'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import type { HotspotConfig } from '@/lib/tour-types';
import BrandLogo from '@/components/brand-logo';
import {
  shortYawDiff,
  panDurationMs,
  transitionDurationMs,
  easeInOutQuad,
  easeInOutCubic,
  PLAYBACK_HFOV,
} from '@/lib/playback-utils';
import { useTourStore } from '@/lib/tour-store';
import { assetPath } from '@/lib/asset-path';
import { resolvePanoramaUrl } from '@/lib/pano-resolution';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PanoViewerHandle {
  getViewer: () => unknown | null;
  getPitch: () => number;
  getYaw: () => number;
  getHfov: () => number;
  lookAt: (pitch?: number, yaw?: number, hfov?: number, speed?: number) => void;
  isOrientationActive: () => boolean;
  startOrientation: () => void;
  stopOrientation: () => void;
}

interface PanoViewerProps {
  /** Optional theme primary colour override (falls back to store) */
  primary?: string;
  /** Called when any hotspot is clicked */
  onHotspotClick?: (hotspot: HotspotConfig) => void;
  /** Extra className for the outer wrapper */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Hotspot CSS (injected once)                                        */
/* ------------------------------------------------------------------ */

const HOTSPOT_CSS = `
/* Neutralize Pannellum's default 26×26 dark hotspot circle */
.pnlm-hotspot-base {
  background: transparent !important;
  border: none !important;
  width: auto !important;
  height: auto !important;
  overflow: visible !important;
  border-radius: 0 !important;
  padding: 0 !important;
  cursor: pointer;
  z-index: 10;
}
.pnlm-hotspot-base::before,
.pnlm-hotspot-base::after {
  display: none !important;
}

/* ── Bubble wrapper ───────────────────────────────────────────── */
.pano-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  animation: bubble-float 3.2s ease-in-out infinite;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
}

.pano-bubble:hover {
  transform: scale(1.15) translateY(-4px);
  animation-play-state: paused;
}

/* ── Pulse rings (behind circle) ─────────────────────────────── */
.pano-bubble-rings {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  /* Cada burbuja recibe su propio --pulse-dur y --pulse-delay desde JS
     para que los pulsos NO esten sincronizados entre burbujas. */
}
.pano-bubble-rings::before,
.pano-bubble-rings::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(142, 104, 73,0.4);
  animation: bubble-pulse var(--pulse-dur, 2.8s) ease-out infinite;
  animation-delay: var(--pulse-delay, 0s);
}
.pano-bubble-rings::before {
  inset: -10px;
}
.pano-bubble-rings::after {
  inset: -20px;
  border-color: rgba(142, 104, 73,0.18);
  animation-delay: calc(var(--pulse-delay, 0s) + 0.5s);
}

/* ── Icon circle ─────────────────────────────────────────────── */
.pano-bubble-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(10, 10, 10, 0.68);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(142, 104, 73,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.92);
  position: relative;
  box-shadow:
    0 0 0 1px rgba(142, 104, 73,0.15),
    0 8px 32px rgba(0,0,0,0.5),
    0 2px 8px rgba(0,0,0,0.4);
  transition: box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}

.pano-bubble:hover .pano-bubble-circle {
  background: rgba(20, 20, 20, 0.80);
  border-color: rgba(142, 104, 73,0.85);
  box-shadow:
    0 0 0 2px rgba(142, 104, 73,0.35),
    0 12px 48px rgba(0,0,0,0.55),
    0 4px 16px rgba(0,0,0,0.4);
}

/* ── Room name pill ──────────────────────────────────────────── */
.pano-bubble-label {
  background: rgba(0,0,0,0.72);
  border: 1px solid rgba(142, 104, 73,0.3);
  border-radius: 24px;
  padding: 3px 10px;
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  white-space: nowrap;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: 0 4px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(142, 104, 73,0.08);
  backdrop-filter: blur(8px);
}

/* ── Info variant ────────────────────────────────────────────── */
.pano-bubble-info .pano-bubble-circle {
  border-color: rgba(142, 104, 73,0.55);
  color: rgba(255, 249, 233,0.95);
  animation-delay: 1.3s;
}

/* ── Animations ──────────────────────────────────────────────── */
@keyframes bubble-float {
  0%,100% { transform: translateY(0px);  }
  50%      { transform: translateY(-9px); }
}
@keyframes bubble-pulse {
  0%   { transform: scale(1);    opacity: 0.7; }
  100% { transform: scale(1.85); opacity: 0;   }
}

/* ── Playback mode: ocultar burbujas ────────────────────────── */
.playback-mode .pnlm-hotspot-base {
  display: none !important;
  pointer-events: none !important;
}

/* ── Overlay de transicion practicamente invisible ─────────────── */
.pano-fade-overlay {
  position: absolute;
  inset: 0;
  background: transparent;
  z-index: 50;
  pointer-events: none;
  transition: opacity .25s ease;
}

/* ── Animaciones cortas — apenas perceptibles ──────────────────── */
@keyframes pano-zoom-forward {
  0%   { filter: blur(0px); }
  50%  { filter: blur(1.5px); }
  100% { filter: blur(0px); }
}
.pano-transitioning-scene {
  animation: pano-zoom-forward 0.32s ease;
  transform-origin: center center;
  will-change: filter;
}

@keyframes pano-variant-dissolve {
  0%   { filter: blur(0) brightness(1); }
  50%  { filter: blur(2px) brightness(1.04); }
  100% { filter: blur(0) brightness(1); }
}
.pano-transitioning-variant {
  animation: pano-variant-dissolve 0.4s ease;
  transform-origin: center center;
  will-change: filter;
}

/* ── Movil: aligerar GPU ─────────────────────────────────────────
   El backdrop-filter se recalcula en cada frame mientras la burbuja
   flota sobre el panorama en movimiento — costoso en GPU movil. En
   pantallas pequenas reducimos el blur y lo quitamos del pill. */
@media (max-width: 768px) {
  .pano-bubble-circle {
    width: 58px;
    height: 58px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
  .pano-bubble-label {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(0,0,0,0.82);
  }
}

/* Respeta la preferencia de menos movimiento del sistema */
@media (prefers-reduced-motion: reduce) {
  .pano-bubble { animation: none; }
  .pano-bubble-rings::before,
  .pano-bubble-rings::after { animation: none; opacity: 0; }
}
`;

/* ------------------------------------------------------------------ */
/*  Room-aware SVG icons                                              */
/* ------------------------------------------------------------------ */

function roomIcon(label: string, type: HotspotConfig['type']): string {
  const S = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  if (type === 'info')
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
  if (type === 'url')
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

  const l = label.toLowerCase();

  // Balcón / Terraza — sun
  if (l.includes('balc') || l.includes('terraz') || l.includes('exterior'))
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

  // Cocina — chef hat
  if (l.includes('cocina') || l.includes('kitchen'))
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>`;

  // Baño / Bath
  if (l.includes('baño') || l.includes('bano') || l.includes('bath'))
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="7" y1="19" x2="7" y2="21"/><line x1="17" y1="19" x2="17" y2="21"/></svg>`;

  // Alcoba / Dormitorio / Bedroom — bed
  if (l.includes('alcoba') || l.includes('dorm') || l.includes('bedroom') || l.includes('habitac') || l.includes('suite'))
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;

  // Sala / Living — sofa
  if (l.includes('sala') || l.includes('estar') || l.includes('living') || l.includes('comedor'))
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="M12 4v9"/></svg>`;

  // Entrada / Hall — door
  if (l.includes('entrada') || l.includes('hall') || l.includes('acceso'))
    return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.267.962L4 20V5.562a2 2 0 0 1 1.533-1.94l6-1.5a2 2 0 0 1 2.467 1.94Z"/></svg>`;

  // Default — arrow
  return `<svg viewBox="0 0 24 24" fill="none" ${S} width="20" height="20"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;
}

/* ------------------------------------------------------------------ */
/*  Build floating bubble for Pannellum                               */
/* ------------------------------------------------------------------ */

// Hash determinista a partir del id del hotspot — usado para sembrar
// duracion y delay del pulso de la burbuja, evitando sincronizacion.
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildHotspotDiv(hs: HotspotConfig): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = `pano-bubble${hs.type === 'info' ? ' pano-bubble-info' : ''}`;

  // Cada burbuja pulsa con un ritmo distinto basado en su id.
  // Duracion entre 2.2s y 3.8s, delay entre 0 y 2.5s.
  const seed = hashSeed(hs.id || hs.label || Math.random().toString());
  const dur = 2.2 + (seed % 17) / 10;           // 2.2 .. 3.8s
  const delay = ((seed >> 4) % 25) / 10;        // 0 .. 2.5s
  wrapper.style.setProperty('--pulse-dur', `${dur.toFixed(2)}s`);
  wrapper.style.setProperty('--pulse-delay', `${delay.toFixed(2)}s`);

  const circle = document.createElement('div');
  circle.className = 'pano-bubble-circle';

  // Pulse rings behind the circle
  const rings = document.createElement('div');
  rings.className = 'pano-bubble-rings';
  circle.appendChild(rings);

  // Icon (bigger: 26px)
  const iconWrapper = document.createElement('div');
  iconWrapper.style.cssText = 'position:relative;z-index:1;display:flex;align-items:center;justify-content:center;';
  iconWrapper.innerHTML = roomIcon(hs.label ?? '', hs.type).replace(/width="20" height="20"/, 'width="26" height="26"');
  circle.appendChild(iconWrapper);

  wrapper.appendChild(circle);

  // Label pill for all hotspot types
  if (hs.label) {
    const pill = document.createElement('div');
    pill.className = 'pano-bubble-label';
    pill.textContent = hs.label;
    wrapper.appendChild(pill);
  }

  return wrapper;
}

/* ── Hotspot estilizado para cambiar de variante en escena ─────── */
function buildVariantHotspotDiv(nextVariantLabel: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'pano-bubble pano-bubble-variant';
  // Pulse ligeramente mas lento para diferenciarlo de las burbujas de escena
  wrapper.style.setProperty('--pulse-dur', '3.6s');
  wrapper.style.setProperty('--pulse-delay', '0.9s');

  const circle = document.createElement('div');
  circle.className = 'pano-bubble-circle';
  circle.style.background = '#8E6849';
  circle.style.borderColor = 'rgba(255,255,255,0.45)';
  circle.style.color = '#FFF9E9';
  circle.style.boxShadow = '0 4px 20px rgba(142, 104, 73,0.4), 0 2px 8px rgba(0,0,0,0.35)';

  const rings = document.createElement('div');
  rings.className = 'pano-bubble-rings';
  circle.appendChild(rings);

  // Icono de capas (Layers) en SVG, 26x26
  const iconWrap = document.createElement('div');
  iconWrap.style.cssText = 'position:relative;z-index:1;display:flex;align-items:center;justify-content:center;color:#FFF9E9;';
  iconWrap.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>`;
  circle.appendChild(iconWrap);
  wrapper.appendChild(circle);

  // Label tipo pill — muestra a qué cambiará
  const pill = document.createElement('div');
  pill.className = 'pano-bubble-label';
  pill.textContent = `Ver ${nextVariantLabel.toLowerCase()}`;
  pill.style.background = 'rgba(142, 104, 73,0.95)';
  pill.style.color = '#FFF9E9';
  pill.style.fontWeight = '700';
  wrapper.appendChild(pill);

  return wrapper;
}

/* ------------------------------------------------------------------ */
/*  Pannellum type declarations                                       */
/* ------------------------------------------------------------------ */

type PannellumViewer = any;

declare global {
  interface Window {
    pannellum: {
      viewer(
        container: string | HTMLElement,
        config: Record<string, unknown>,
      ): PannellumViewer;
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PanoViewer = forwardRef<PanoViewerHandle, PanoViewerProps>(
  function PanoViewer({ onHotspotClick, className }, ref) {
    /* ── State ─────────────────────────────────────────────────── */
    const [scriptReady, setScriptReady] = useState(false);
    const [fadeOpacity, setFadeOpacity] = useState(0);
    // Double buffer: que layer esta activo (visible)
    const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
    const [layerAOpacity, setLayerAOpacity] = useState(1);
    const [layerBOpacity, setLayerBOpacity] = useState(0);

    /* ── Refs ──────────────────────────────────────────────────── */
    const containerARef = useRef<HTMLDivElement>(null);
    const containerBRef = useRef<HTMLDivElement>(null);
    const viewerARef = useRef<PannellumViewer | null>(null);
    const viewerBRef = useRef<PannellumViewer | null>(null);
    const activeLayerRef = useRef<'A' | 'B'>('A');
    const cssInjected = useRef(false);
    const transitionLock = useRef(false);
    // Animaciones de playback — handles del rAF activo y del timeout de arranque
    const playbackRafRef = useRef<number | null>(null);
    const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Para que getViewer/handles publicos sigan funcionando
    const viewerRef = useRef<PannellumViewer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    /* ── Store ─────────────────────────────────────────────────── */
    const selectedApartment = useTourStore((s) => s.selectedApartment);
    const scenes = selectedApartment?.scenes ?? [];
    const currentSceneId = useTourStore((s) => s.currentSceneId);
    const autoRotate = useTourStore((s) => s.autoRotate);
    const autoRotateSpeed = useTourStore((s) => s.config.autoRotateSpeed);
    const isPlaybackMode = useTourStore((s) => s.isPlaybackMode);
    const setTransitioning = useTourStore((s) => s.setTransitioning);
    const setViewerYaw = useTourStore((s) => s.setViewerYaw);
    const themePrimary = useTourStore((s) => s.config.theme.primary);
    const selectedVariants = useTourStore((s) => s.selectedVariants);
    const setSceneVariant = useTourStore((s) => s.setSceneVariant);
    const setCurrentScene = useTourStore((s) => s.setCurrentScene);

    /* ── Current scene memo ────────────────────────────────────── */
    const currentScene = scenes.find((s) => s.id === currentSceneId);

    /* ── Debug flag (?debug=1) ─────────────────────────────────── */
    const debugEnabled = typeof window !== 'undefined' && window.location.search.includes('debug=1');

    /* ── Inject CSS once ───────────────────────────────────────── */
    useEffect(() => {
      if (cssInjected.current) return;
      cssInjected.current = true;
      const tag = document.createElement('style');
      tag.dataset.panoCss = 'true';
      tag.textContent = HOTSPOT_CSS;
      document.head.appendChild(tag);
    }, []);

    /* ── Load Pannellum from CDN ───────────────────────────────── */
    useEffect(() => {
      if (scriptReady) return;

      // CSS link (idempotent)
      const cssId = 'pannellum-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href =
          'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
        document.head.appendChild(link);
      }

      // JS script
      const jsId = 'pannellum-js';
      const existing = document.getElementById(jsId) as HTMLScriptElement | null;
      if (existing) {
        // Already in DOM – wait for load if still pending
        if (window.pannellum) {
          requestAnimationFrame(() => setScriptReady(true));
        } else {
          existing.addEventListener('load', () => setScriptReady(true), {
            once: true,
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.id = jsId;
      script.src =
        'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      script.async = true;
      script.addEventListener('load', () => setScriptReady(true), { once: true });
      document.body.appendChild(script);
    }, [scriptReady]);

    /* ── Build Pannellum config ────────────────────────────────── */
    const buildConfig = useCallback(
      (sceneId: string, viewOverride?: { pitch: number; yaw: number; hfov: number }) => {
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return null;

        // Aplica variant si la escena tiene variantes y hay una seleccionada
        const variants = scene.variants ?? [];
        const variantId = selectedVariants[sceneId];
        const variant = variants.find((v) => v.id === variantId);
        // Resolucion segun dispositivo: 8000px en desktop, 4096px en movil.
        const panorama = resolvePanoramaUrl(variant?.panorama ?? scene.panorama);
        const defaultView = variant?.defaultView ?? scene.defaultView;
        // Si hay override, lo usamos como vista inicial (preserva direccion)
        const initialView = viewOverride ?? defaultView;

        // ¿La escena destino tiene una variante con este id (p.ej. "obra-gris")?
        const sceneHasVariant = (sid: string, vid: string) =>
          !!scenes.find((s) => s.id === sid)?.variants?.some((v) => v.id === vid);

        // En la variante "obra gris" (cualquier variante distinta a la primera/
        // amueblada) NO ocultamos toda la navegación: mostramos solo las burbujas
        // hacia cuartos que TAMBIÉN tienen esa variante, para poder recorrer la
        // casa entera en obra gris (p.ej. subir al 2º piso o ver la alcoba en
        // obra gris). El resto de burbujas se ocultan; siempre queda el botón de
        // variante ("Ver amueblado") para volver a la vista normal.
        const showingAltVariant =
          variants.length >= 2 && variantId != null && variantId !== variants[0].id;
        const navHotspots = (scene.hotspots ?? []).filter((h) => {
          if (showingAltVariant) {
            if (h.type !== 'scene' || !h.targetSceneId) return false;
            // Burbuja exclusiva de una variante (puente solo-gris), o cuarto
            // que TAMBIÉN tiene la variante activa.
            if (h.onlyInVariant) return h.onlyInVariant === variantId;
            return sceneHasVariant(h.targetSceneId, variantId!);
          }
          // Vista amueblada: ocultar las burbujas exclusivas de otra variante.
          return !h.onlyInVariant;
        });

        const hotspots: Record<string, unknown>[] = navHotspots.map(
          (hs: HotspotConfig, idx: number) => ({
            id: `hs-${sceneId}-${idx}`,
            pitch: hs.pitch,
            yaw: hs.yaw,
            type: 'custom' as const,
            createTooltipFunc: (hotSpotDiv: HTMLElement) => {
              hotSpotDiv.style.cssText = 'cursor:pointer;';
              hotSpotDiv.appendChild(buildHotspotDiv(hs));
            },
            clickHandlerFunc: () => {
              // Al navegar entre cuartos preservamos la variante de forma
              // predecible: en obra gris el destino abre en obra gris; en
              // amueblado el destino abre en amueblado (evita que la variante
              // quede "pegajosa" entre escenas).
              if (hs.type === 'scene' && hs.targetSceneId) {
                const target = scenes.find((s) => s.id === hs.targetSceneId);
                if (showingAltVariant && sceneHasVariant(hs.targetSceneId, variantId!)) {
                  setSceneVariant(hs.targetSceneId, variantId!);
                  setCurrentScene(hs.targetSceneId);
                  return;
                }
                if (target?.variants?.length) {
                  setSceneVariant(hs.targetSceneId, target.variants[0].id);
                  setCurrentScene(hs.targetSceneId);
                  return;
                }
              }
              onHotspotClick?.(hs);
            },
          }),
        );

        // Hotspot extra para cambiar de variante (solo si la escena tiene >=2 variants y posicion definida)
        if (variants.length >= 2 && scene.variantButton) {
          const currentVariantIdx = Math.max(0, variants.findIndex((v) => v.id === (variantId ?? variants[0].id)));
          const nextIdx = (currentVariantIdx + 1) % variants.length;
          const nextVariant = variants[nextIdx];
          hotspots.push({
            id: `hs-${sceneId}-variant`,
            pitch: scene.variantButton.pitch,
            yaw: scene.variantButton.yaw,
            type: 'custom' as const,
            createTooltipFunc: (hotSpotDiv: HTMLElement) => {
              hotSpotDiv.style.cssText = 'cursor:pointer;';
              hotSpotDiv.appendChild(buildVariantHotspotDiv(nextVariant.label));
            },
            clickHandlerFunc: () => {
              // Si la variante apunta a otra escena, navegamos alli.
              // Esto sucede cuando el "render alternativo" corresponde
              // fisicamente a otro cuarto del apartamento (ej: el render
              // de alcoba para Espacio Multiple en realidad esta en
              // Espacio Multiple 2). De esta forma el floor plan
              // refleja el cambio y cada cuarto tiene su propia
              // calibracion de hotspots/boton de variante.
              if (nextVariant.linkSceneId) {
                if (nextVariant.linkVariantId) {
                  setSceneVariant(nextVariant.linkSceneId, nextVariant.linkVariantId);
                }
                setCurrentScene(nextVariant.linkSceneId);
              } else {
                setSceneVariant(sceneId, nextVariant.id);
              }
            },
          });
        }

        return {
          type: 'equirectangular',
          panorama,
          pitch: initialView?.pitch ?? 0,
          yaw: initialView?.yaw ?? 0,
          // Playback: HFOV amplio para mostrar el mayor espacio posible
          hfov: isPlaybackMode ? PLAYBACK_HFOV : (initialView?.hfov ?? 100),
          maxHfov: isPlaybackMode ? 150 : 120,
          // Playback: sin autoRotate — la animación lookAt es más cinematográfica
          autoRotate: debugEnabled ? 0 : (isPlaybackMode ? 0 : (autoRotate ? autoRotateSpeed : 0)),
          autoRotateInactivityDelay: debugEnabled ? 0 : (autoRotate && !isPlaybackMode ? 2000 : 0),
          compass: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          mouseZoom: true,
          hotSpots: hotspots,
          autoLoad: true,
          showControls: false,
          draggable: true,
          friction: 0.15,
          minYaw: -180,
          maxYaw: 180,
          minPitch: -85,
          maxPitch: 85,
        };
      },
      [scenes, autoRotate, autoRotateSpeed, onHotspotClick, debugEnabled, selectedVariants, setSceneVariant, setCurrentScene],
    );

    /* ── Crea viewer en un layer especifico (A o B) ────────────── */
    const initViewerOnLayer = useCallback(
      (
        layer: 'A' | 'B',
        sceneId: string,
        viewOverride?: { pitch: number; yaw: number; hfov: number },
      ): PannellumViewer | null => {
        if (!window.pannellum) return null;
        const container = layer === 'A' ? containerARef.current : containerBRef.current;
        if (!container) return null;

        const slotRef = layer === 'A' ? viewerARef : viewerBRef;
        if (slotRef.current) {
          try { slotRef.current.destroy(); } catch { /* ignore */ }
          slotRef.current = null;
        }
        container.innerHTML = '';

        const config = buildConfig(sceneId, viewOverride);
        if (!config) return null;

        try {
          slotRef.current = window.pannellum.viewer(container, config);
          return slotRef.current;
        } catch (err) {
          console.error('[PanoViewer] Init failed:', err);
          return null;
        }
      },
      [buildConfig],
    );

    // initViewer publico (compatibilidad) — siempre apunta al layer activo
    const initViewer = useCallback(
      (sceneId: string, viewOverride?: { pitch: number; yaw: number; hfov: number }) => {
        const layer = activeLayerRef.current;
        initViewerOnLayer(layer, sceneId, viewOverride);
        viewerRef.current = layer === 'A' ? viewerARef.current : viewerBRef.current;
        containerRef.current = layer === 'A' ? containerARef.current : containerBRef.current;
      },
      [initViewerOnLayer],
    );

    // Variant activa para la escena actual (re-init del viewer cuando cambia)
    const currentVariantId = selectedVariants[currentSceneId] ?? '';

    // Distinguir el tipo de transicion: 'scene' (cambio de cuarto) vs 'variant' (mismo cuarto)
    const lastSceneRef = useRef<string>('');
    const [transitionMode, setTransitionMode] = useState<'scene' | 'variant' | 'none'>('none');

    /* ── Cambio de escena: DOUBLE BUFFER + CROSSFADE ──────────────
       Estrategia:
       1. Capturar vista actual del viewer activo.
       2. Construir el nuevo viewer en el layer INACTIVO (oculto).
       3. Esperar su 'load' — durante este tiempo el usuario sigue viendo
          la escena anterior, NO hay flash negro ni loading visible.
       4. Crossfade: fade-out del layer activo, fade-in del nuevo.
       5. Despues del crossfade, destruir el viejo viewer.
    ──────────────────────────────────────────────────────────── */
    useEffect(() => {
      if (!scriptReady || !currentSceneId) return;
      if (transitionLock.current) return;

      // Primera carga: no hay viewer todavia → init directo en layer A
      if (!viewerARef.current && !viewerBRef.current) {
        lastSceneRef.current = currentSceneId;
        activeLayerRef.current = 'A';
        setActiveLayer('A');
        initViewerOnLayer('A', currentSceneId);
        viewerRef.current = viewerARef.current;
        containerRef.current = containerARef.current;
        setLayerAOpacity(1);
        setLayerBOpacity(0);
        return;
      }

      const active = activeLayerRef.current;
      const activeViewer = active === 'A' ? viewerARef.current : viewerBRef.current;
      let preservedView: { pitch: number; yaw: number; hfov: number } | undefined;

      if (isPlaybackMode) {
        // El viewer arranca en el FROM de la primera animación (o el defaultView).
        // La secuencia de pans se ejecuta en el useEffect dedicado de playback.
        const playScene = scenes.find((s) => s.id === currentSceneId);
        const first = playScene?.playbackAnimations?.[0];
        preservedView = first
          ? { pitch: first.from.pitch, yaw: first.from.yaw, hfov: PLAYBACK_HFOV }
          : { pitch: playScene?.defaultView?.pitch ?? 0, yaw: playScene?.defaultView?.yaw ?? 0, hfov: PLAYBACK_HFOV };
      } else {
        try {
          if (activeViewer) {
            preservedView = {
              pitch: activeViewer.getPitch(),
              yaw: activeViewer.getYaw(),
              hfov: activeViewer.getHfov(),
            };
          }
        } catch { /* ignore */ }
      }

      const isVariantOnly = lastSceneRef.current === currentSceneId;
      const mode: 'scene' | 'variant' = isVariantOnly ? 'variant' : 'scene';
      lastSceneRef.current = currentSceneId;

      transitionLock.current = true;
      setTransitioning(true);
      setTransitionMode(mode);

      // Construir nuevo viewer en el layer INACTIVO
      const inactive: 'A' | 'B' = active === 'A' ? 'B' : 'A';
      const newViewer = initViewerOnLayer(inactive, currentSceneId, preservedView);

      const doCrossfade = () => {
        // Crossfade: el inactivo se vuelve visible, el activo desaparece
        activeLayerRef.current = inactive;
        setActiveLayer(inactive);
        if (inactive === 'A') {
          setLayerAOpacity(1);
          setLayerBOpacity(0);
        } else {
          setLayerBOpacity(1);
          setLayerAOpacity(0);
        }
        // Apuntar refs publicos al nuevo activo
        viewerRef.current = inactive === 'A' ? viewerARef.current : viewerBRef.current;
        containerRef.current = inactive === 'A' ? containerARef.current : containerBRef.current;

        // Despues del crossfade, destruir el viewer viejo para liberar memoria
        const CROSSFADE_MS = mode === 'variant' ? 280 : 360;
        setTimeout(() => {
          const oldRef = active === 'A' ? viewerARef : viewerBRef;
          if (oldRef.current) {
            try { oldRef.current.destroy(); } catch { /* ignore */ }
            oldRef.current = null;
          }
          setTransitioning(false);
          setTransitionMode('none');
          transitionLock.current = false;

          // (la secuencia de animaciones de playback se maneja en el useEffect dedicado)

          // Precargar panoramas de escenas adyacentes para transiciones instantáneas
          const loadedScene = scenes.find((s) => s.id === currentSceneId);
          const adjIds = (loadedScene?.hotspots ?? [])
            .filter((h) => h.type === 'scene' && h.targetSceneId)
            .map((h) => h.targetSceneId!);
          for (const adjId of adjIds) {
            const adjScene = scenes.find((s) => s.id === adjId);
            if (adjScene) {
              const img = new Image();
              img.src = resolvePanoramaUrl(adjScene.panorama);
            }
          }
        }, CROSSFADE_MS + 50);
      };

      if (newViewer) {
        // Fallback por si load nunca dispara
        const fallback = setTimeout(doCrossfade, 4000);
        try {
          newViewer.on('load', () => {
            clearTimeout(fallback);
            // Pequeno delay para que la primera frame este renderizada
            requestAnimationFrame(() => requestAnimationFrame(doCrossfade));
          });
        } catch {
          doCrossfade();
        }
      } else {
        doCrossfade();
      }
    }, [scriptReady, currentSceneId, currentVariantId, initViewerOnLayer, setTransitioning]);

    /* ── Fullscreen change handler ─────────────────────────────── */
    useEffect(() => {
      const onFsChange = () => {
        // Force Pannellum to resize after fullscreen toggle
        if (viewerRef.current) {
          setTimeout(() => {
            try {
              viewerRef.current.resize();
            } catch {
              /* ignore */
            }
          }, 100);
        }
      };

      document.addEventListener('fullscreenchange', onFsChange);
      document.addEventListener('webkitfullscreenchange', onFsChange);

      return () => {
        document.removeEventListener('fullscreenchange', onFsChange);
        document.removeEventListener('webkitfullscreenchange', onFsChange);
      };
    }, []);

    /* ── Imperative handle ─────────────────────────────────────── */
    useImperativeHandle(ref, () => ({
      getViewer: () => viewerRef.current,
      getPitch: () => viewerRef.current?.getPitch?.() ?? 0,
      getYaw: () => viewerRef.current?.getYaw?.() ?? 0,
      getHfov: () => viewerRef.current?.getHfov?.() ?? 100,
      lookAt: (pitch?: number, yaw?: number, hfov?: number, speed?: number) => {
        if (!viewerRef.current) return;
        try { viewerRef.current.lookAt(pitch, yaw, hfov, speed); } catch { /* ignore */ }
      },
      isOrientationActive: () => {
        try { return viewerRef.current?.isOrientationActive?.() ?? false; } catch { return false; }
      },
      startOrientation: () => {
        try { viewerRef.current?.startOrientation?.(); } catch { /* ignore */ }
      },
      stopOrientation: () => {
        try { viewerRef.current?.stopOrientation?.(); } catch { /* ignore */ }
      },
    }));

    /* ── Yaw polling → floor plan radar ───────────────────────── */
    useEffect(() => {
      const interval = setInterval(() => {
        if (viewerRef.current) {
          try { setViewerYaw(viewerRef.current.getYaw()); } catch { /* ignore */ }
        }
      }, 100);
      return () => clearInterval(interval);
    }, [setViewerYaw]);

    /* ── Secuencia de animaciones en modo reproducción ─────────────
       Recorre cada playbackAnimation con un pan suave (from → to) a
       velocidad constante, y encadena con una transición de conexión
       (to → from de la siguiente). Todo con requestAnimationFrame para
       máxima fluidez. La cámara nunca se detiene hasta terminar la escena.
    ──────────────────────────────────────────────────────────────── */
    useEffect(() => {
      if (!isPlaybackMode || !scriptReady || !currentSceneId) return;

      const cancelRaf = () => {
        if (playbackRafRef.current !== null) { cancelAnimationFrame(playbackRafRef.current); playbackRafRef.current = null; }
      };
      const clearStart = () => {
        if (playbackTimeoutRef.current) { clearTimeout(playbackTimeoutRef.current); playbackTimeoutRef.current = null; }
      };
      cancelRaf();
      clearStart();

      const scene = scenes.find((s) => s.id === currentSceneId);
      const animations = scene?.playbackAnimations ?? [];
      if (!animations.length) return;

      /* Pan suave entre dos posiciones usando rAF. */
      const smoothPan = (
        fromPitch: number, fromYaw: number,
        toPitch: number,   toYaw: number,
        durationMs: number,
        easeFn: (t: number) => number,
        onDone: () => void,
      ) => {
        if (durationMs <= 0) { onDone(); return; }
        const pitchDiff = toPitch - fromPitch;
        const yDiff     = shortYawDiff(fromYaw, toYaw);
        const start     = performance.now();

        const frame = (now: number) => {
          if (!useTourStore.getState().isPlaybackMode) return;
          const elapsed = now - start;
          const t = easeFn(Math.min(elapsed / durationMs, 1));
          try {
            (viewerRef.current as any)?.setPitch?.(fromPitch + pitchDiff * t, false);
            (viewerRef.current as any)?.setYaw?.(fromYaw + yDiff * t, false);
          } catch { /* ignore */ }

          if (elapsed < durationMs) {
            playbackRafRef.current = requestAnimationFrame(frame);
          } else {
            playbackRafRef.current = null;
            onDone();
          }
        };
        playbackRafRef.current = requestAnimationFrame(frame);
      };

      /* Runner recursivo — encadena pans y transiciones sin pausas. */
      const runSequence = (idx: number) => {
        if (!useTourStore.getState().isPlaybackMode || idx >= animations.length) return;
        const anim = animations[idx];

        smoothPan(
          anim.from.pitch, anim.from.yaw,
          anim.to.pitch,   anim.to.yaw,
          panDurationMs(anim),
          easeInOutQuad,
          () => {
            const next = animations[idx + 1];
            if (!next) return; // el timer de usePlayback avanza la escena
            smoothPan(
              anim.to.pitch, anim.to.yaw,
              next.from.pitch, next.from.yaw,
              transitionDurationMs(anim.to, next.from),
              easeInOutCubic,
              () => runSequence(idx + 1),
            );
          },
        );
      };

      // Esperar a que el viewer exista, fijar el FROM inicial y arrancar
      const waitForViewer = setInterval(() => {
        if (viewerRef.current) {
          clearInterval(waitForViewer);
          try {
            (viewerRef.current as any)?.setHfov?.(PLAYBACK_HFOV, false);
            (viewerRef.current as any)?.setPitch?.(animations[0].from.pitch, false);
            (viewerRef.current as any)?.setYaw?.(animations[0].from.yaw, false);
          } catch { /* ignore */ }
          playbackTimeoutRef.current = setTimeout(() => runSequence(0), 250);
        }
      }, 30);

      return () => {
        clearInterval(waitForViewer);
        cancelRaf();
        clearStart();
      };
    }, [isPlaybackMode, currentSceneId, scriptReady]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Render ────────────────────────────────────────────────── */
    // Nota: el arrastre horizontal en móvil rota la vista 360 (manejado por
    // Pannellum). NO se usa swipe para cambiar de escena — generaba cambios
    // accidentales al mirar alrededor. La navegación es por hotspots y controles.
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 8,
          background: '#0a0a0a',
        }}
      >
        {/* Double-buffer Pannellum containers — Layer A */}
        <div
          ref={containerARef}
          className={
            activeLayer === 'A' && transitionMode === 'scene'
              ? 'pano-transitioning-scene'
              : activeLayer === 'A' && transitionMode === 'variant'
                ? 'pano-transitioning-variant'
                : ''
          }
          style={{
            position: 'absolute',
            inset: 0,
            opacity: layerAOpacity,
            // El layer activo recibe los eventos; el inactivo no debe robar el cursor
            pointerEvents: activeLayer === 'A' ? 'auto' : 'none',
            transition: 'opacity 360ms cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: activeLayer === 'A' ? 2 : 1,
          }}
        />
        {/* Double-buffer Pannellum containers — Layer B (precarga oculta) */}
        <div
          ref={containerBRef}
          className={
            activeLayer === 'B' && transitionMode === 'scene'
              ? 'pano-transitioning-scene'
              : activeLayer === 'B' && transitionMode === 'variant'
                ? 'pano-transitioning-variant'
                : ''
          }
          style={{
            position: 'absolute',
            inset: 0,
            opacity: layerBOpacity,
            pointerEvents: activeLayer === 'B' ? 'auto' : 'none',
            transition: 'opacity 360ms cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: activeLayer === 'B' ? 2 : 1,
          }}
        />

        {/* Fade overlay */}
        <div
          className="pano-fade-overlay"
          style={{ opacity: fadeOpacity }}
          aria-hidden
        />

        {/* Debug panel se monta desde page.tsx como componente separado */}

        {/* Loading state */}
        {!scriptReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, zIndex: 100, background: '#000' }}>
            <BrandLogo style={{ width: 230 }} />
            <div style={{ position: 'relative', width: 36, height: 36, marginTop: 28, marginBottom: 20 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#8E6849', animation: 'pano-spin 1.2s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(142, 104, 73,0.3)', animation: 'pano-spin 1.8s linear infinite reverse' }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#8E6849', animation: `pano-pulse 1.4s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
            <style>{`
              @keyframes pano-spin { to { transform: rotate(360deg) } }
              @keyframes pano-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
            `}</style>
          </div>
        )}
      </div>
    );
  },
);

PanoViewer.displayName = 'PanoViewer';

export default PanoViewer;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Convert "#rrggbb" to "r, g, b" for rgba usage */
function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    return [
      parseInt(cleaned[0] + cleaned[0], 16),
      parseInt(cleaned[1] + cleaned[1], 16),
      parseInt(cleaned[2] + cleaned[2], 16),
    ].join(', ');
  }
  const n = parseInt(cleaned, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
