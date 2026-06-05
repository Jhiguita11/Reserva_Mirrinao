'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import PanoViewer from '@/components/pano-viewer';
import type { PanoViewerHandle } from '@/components/pano-viewer';
import FloorPlan from '@/components/floor-plan';
import TourControls from '@/components/tour-controls';
import InfoPanel from '@/components/info-panel';
import LeftSidebar from '@/components/left-sidebar';
import BuildingSelector from '@/components/building-selector';
import SceneSelector from '@/components/scene-selector';
import SplashScreen from '@/components/splash-screen';
import MediaGallery from '@/components/media-gallery';
import LoadingScreen from '@/components/loading-screen';
import TourWelcome from '@/components/tour-welcome';
import BrandBadge from '@/components/brand-badge';
import HelpHint from '@/components/help-hint';
import CtaButton from '@/components/cta-button';
import PlaybackOverlay from '@/components/playback-overlay';
import { useTourStore } from '@/lib/tour-store';
import { useTourKeyboard } from '@/lib/use-tour-keyboard';
import { useSceneAnalytics } from '@/lib/use-scene-analytics';
import { usePlayback } from '@/lib/use-playback';
import { useInactivityPlayback } from '@/lib/use-inactivity-playback';
import { useUiSound } from '@/lib/use-ui-sound';
import type { HotspotConfig } from '@/lib/tour-types';

const DebugPanel = process.env.NODE_ENV !== 'production'
  ? require('@/components/debug-panel').default
  : () => null;

// ═══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const viewerRef = useRef<PanoViewerHandle>(null);
  const {
    selectedApartment,
    config,
    setCurrentScene,
    showInfo,
    isTransitioning,
    setApartment,
    setApartmentAtScene,
    isPlaybackMode,
  } = useTourStore();

  // Atajos de teclado para desktop
  useTourKeyboard(viewerRef);

  // Sonido de clic en botones / enlaces
  useUiSound();

  // Analytics de tiempo por escena
  useSceneAnalytics();

  // Motor del modo reproducción
  usePlayback();

  const previewAptParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('preview')
    : null;
  const previewSceneParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('scene')
    : null;

  const [showSplash, setShowSplash] = useState(!previewAptParam);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => !previewAptParam && config.showWelcome);
  const [showHelp, setShowHelp] = useState(true);
  const lastAptIdRef = useRef<string | null>(null);

  // Auto-activar modo reproducción tras inactividad (solo con el tour visible)
  useInactivityPlayback(scriptLoaded && !showWelcome && !!selectedApartment);

  // ?preview=<apt-id>&scene=<scene-id> — carga directa, salta splash y welcome
  useEffect(() => {
    if (!previewAptParam || selectedApartment) return;
    const allApts = config.buildings.flatMap((b) => b.apartments);
    const target = allApts.find(
      (a) => a.id.includes(previewAptParam) || a.name.toLowerCase().includes(previewAptParam),
    );
    if (!target) return;
    if (previewSceneParam) {
      setApartmentAtScene(target, previewSceneParam);
    } else {
      setApartment(target);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resetear welcome al cambiar de apartamento
  const currentAptId = selectedApartment?.id ?? null;
  useEffect(() => {
    if (currentAptId && lastAptIdRef.current && currentAptId !== lastAptIdRef.current) {
      const t = requestAnimationFrame(() => {
        setShowWelcome(true);
        setShowHelp(true);
      });
      lastAptIdRef.current = currentAptId;
      return () => cancelAnimationFrame(t);
    }
    lastAptIdRef.current = currentAptId;
  }, [currentAptId]);

  // Esperar a que cargue Pannellum
  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).pannellum) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Ocultar hint de ayuda tras 6s
  useEffect(() => {
    if (!showWelcome && selectedApartment) {
      const t = setTimeout(() => setShowHelp(false), 6000);
      return () => clearTimeout(t);
    }
  }, [showWelcome, selectedApartment]);

  const handleHotspotClick = useCallback(
    (hotspot: HotspotConfig) => {
      switch (hotspot.type) {
        case 'scene':
          if (hotspot.targetSceneId) setCurrentScene(hotspot.targetSceneId);
          break;
        case 'info':
          showInfo(hotspot.label, hotspot.description || '');
          break;
        case 'url':
          if (hotspot.url) window.open(hotspot.url, '_blank');
          break;
      }
    },
    [setCurrentScene, showInfo],
  );

  // ── Building Selection Screen ──
  if (!selectedApartment) {
    return (
      <>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <BuildingSelector />
      </>
    );
  }

  const isReady = scriptLoaded;

  // ── Tour View ──
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {!isReady && <LoadingScreen />}

      {showWelcome && isReady && <TourWelcome onStart={() => setShowWelcome(false)} />}

      <div
        className="scene-transition-overlay"
        style={{ opacity: isTransitioning ? 1 : 0, pointerEvents: isTransitioning ? 'all' : 'none' }}
      />

      <div className="absolute inset-0" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <PanoViewer
          ref={viewerRef}
          onHotspotClick={handleHotspotClick}
          className={isPlaybackMode ? 'playback-mode' : undefined}
        />
      </div>

      {!showWelcome && isReady && (
        <>
          {/* UI normal — se oculta en modo reproducción */}
          {!isPlaybackMode && <LeftSidebar />}
          {!isPlaybackMode && <SceneSelector />}
          {!isPlaybackMode && <BrandBadge />}
          {!isPlaybackMode && <MediaGallery />}
          {!isPlaybackMode && showHelp && <HelpHint />}
          {!isPlaybackMode && <FloorPlan />}
          {!isPlaybackMode && <CtaButton />}
          {!isPlaybackMode && <InfoPanel />}
          {!isPlaybackMode && <TourControls viewerRef={viewerRef} />}
          <DebugPanel viewerHandle={viewerRef} />

          {/* Overlay del modo reproducción */}
          {isPlaybackMode && <PlaybackOverlay />}
        </>
      )}
    </div>
  );
}
