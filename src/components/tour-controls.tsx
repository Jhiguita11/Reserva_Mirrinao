'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Play,
} from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';
import type { PanoViewerHandle } from '@/components/pano-viewer';

interface TourControlsProps {
  viewerRef: React.RefObject<PanoViewerHandle | null>;
}

const GOLD = '#8E6849';

export default function TourControls({ viewerRef }: TourControlsProps) {
  const selectedApartment = useTourStore((s) => s.selectedApartment);
  const currentSceneIndex = useTourStore((s) => s.currentSceneIndex);
  const isFullscreen = useTourStore((s) => s.isFullscreen);
  const showFloorPlan = useTourStore((s) => s.showFloorPlan);
  const autoRotate = useTourStore((s) => s.autoRotate);
  const toggleFullscreen = useTourStore((s) => s.toggleFullscreen);
  const toggleFloorPlan = useTourStore((s) => s.toggleFloorPlan);
  const toggleAutoRotate = useTourStore((s) => s.toggleAutoRotate);
  const nextScene = useTourStore((s) => s.nextScene);
  const prevScene = useTourStore((s) => s.prevScene);
  const setCurrentScene = useTourStore((s) => s.setCurrentScene);
  const startPlayback   = useTourStore((s) => s.startPlayback);

  const scenes = selectedApartment?.scenes ?? [];
  const currentScene = scenes[currentSceneIndex];
  const totalScenes = scenes.length;

  const [isGyroActive, setIsGyroActive] = useState(false);

  const handlePrev = useCallback(() => prevScene(), [prevScene]);
  const handleNext = useCallback(() => nextScene(), [nextScene]);

  // Sincroniza el store con el estado real del navegador
  useEffect(() => {
    const onFullscreenChange = () => {
      const isNow = !!document.fullscreenElement;
      if (isNow !== isFullscreen) toggleFullscreen();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [isFullscreen, toggleFullscreen]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleSceneDot = useCallback(
    (index: number) => {
      const scene = scenes[index];
      if (scene) setCurrentScene(scene.id);
    },
    [scenes, setCurrentScene],
  );

  const handleGyroscope = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (isGyroActive) {
      viewer.stopOrientation();
      setIsGyroActive(false);
    } else {
      viewer.startOrientation();
      setIsGyroActive(true);
    }
  }, [viewerRef, isGyroActive]);

  const btnBase = 'w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none';
  const btnDefault = `${btnBase} bg-black/50 backdrop-blur-md border border-[rgba(142, 104, 73,0.12)] text-[rgba(255, 249, 233,0.55)] hover:text-[#FFF9E9] hover:bg-black/70 hover:border-[rgba(142, 104, 73,0.25)] hover:scale-105 active:scale-95`;
  const btnActive = `${btnBase} bg-[#8E6849] text-[#FFF9E9] shadow-md shadow-[rgba(142, 104, 73,0.25)]`;

  // Flechas del Scene Dots Strip — más compactas que los controles
  const arrowBtn = 'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none text-[rgba(255, 249, 233,0.55)] hover:text-[#FFF9E9] hover:scale-110 active:scale-95';

  return (
    <div className="fixed bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 md:gap-2.5">

      {/* ─── Scene Dots Strip ─── */}
      <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[rgba(142, 104, 73,0.1)]">
        {/* Prev */}
        <button
          onClick={handlePrev}
          disabled={currentSceneIndex === 0}
          className={`${arrowBtn} disabled:opacity-25 disabled:pointer-events-none`}
          aria-label="Anterior"
          title="Anterior (←)"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {scenes.map((scene, i) => {
            const isActive = i === currentSceneIndex;
            return (
              <button
                key={scene.id}
                onClick={() => handleSceneDot(i)}
                title={scene.name}
                className="rounded-full transition-all duration-300 cursor-pointer outline-none border-0 p-0"
                style={{
                  width: isActive ? 26 : 8,
                  height: 8,
                  backgroundColor: isActive ? GOLD : 'rgba(142, 104, 73,0.25)',
                  boxShadow: isActive ? `0 0 8px ${GOLD}44` : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Next */}
        <button
          onClick={handleNext}
          disabled={currentSceneIndex === totalScenes - 1}
          className={`${arrowBtn} disabled:opacity-25 disabled:pointer-events-none`}
          aria-label="Siguiente"
          title="Siguiente (→)"
        >
          <ChevronRight size={16} />
        </button>

        {/* Divider + scene name — visible en todas las pantallas */}
        <div className="w-px h-5 bg-[rgba(142, 104, 73,0.15)] mx-0.5" />
        <span className="text-[10px] sm:text-[12px] text-[rgba(255, 249, 233,0.6)] font-medium tracking-wide whitespace-nowrap tabular-nums max-w-[100px] sm:max-w-none truncate">
          {currentScene?.name ?? ''}&nbsp;·&nbsp;{currentSceneIndex + 1}/{totalScenes}
        </span>
      </div>

      {/* ─── Controls Strip ─── */}
      <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-[rgba(142, 104, 73,0.1)]">

        {/* Reset view */}
        <button
          onClick={() => {
            const scene = scenes[currentSceneIndex];
            if (!scene?.defaultView) return;
            viewerRef.current?.lookAt(scene.defaultView.pitch, scene.defaultView.yaw, scene.defaultView.hfov);
          }}
          className={btnDefault}
          title="Restablecer vista (Inicio)"
        >
          <Home size={18} />
        </button>

        {/* Auto-rotate */}
        <button
          onClick={toggleAutoRotate}
          className={autoRotate ? btnActive : btnDefault}
          title="Auto-rotar (R)"
        >
          <RotateCcw
            size={18}
            className={autoRotate ? 'animate-spin' : ''}
            style={autoRotate ? { animationDuration: '3s' } : undefined}
          />
        </button>

        <div className="w-px h-5 bg-[rgba(142, 104, 73,0.15)]" />

        {/* Zoom out — oculto en móvil (se usa pinch) */}
        <button
          onClick={() => {
            const hfov = viewerRef.current?.getHfov() ?? 100;
            viewerRef.current?.lookAt(undefined, undefined, Math.min(150, hfov + 15));
          }}
          className={`${btnDefault} hidden sm:flex`}
          title="Alejar"
        >
          <ZoomOut size={18} />
        </button>

        {/* Zoom in — oculto en móvil */}
        <button
          onClick={() => {
            const hfov = viewerRef.current?.getHfov() ?? 100;
            viewerRef.current?.lookAt(undefined, undefined, Math.max(30, hfov - 15));
          }}
          className={`${btnDefault} hidden sm:flex`}
          title="Acercar"
        >
          <ZoomIn size={18} />
        </button>

        <div className="hidden sm:block w-px h-5 bg-[rgba(142, 104, 73,0.15)]" />

        {/* Giroscopio — solo en móvil */}
        <button
          onClick={handleGyroscope}
          className={`${isGyroActive ? btnActive : btnDefault} md:hidden`}
          title="Giroscopio"
          aria-label={isGyroActive ? 'Desactivar giroscopio' : 'Activar giroscopio'}
        >
          <Navigation size={18} />
        </button>

        {/* Floor plan */}
        <button
          onClick={toggleFloorPlan}
          className={showFloorPlan ? btnActive : btnDefault}
          title="Plano (M)"
        >
          <MapPin size={18} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className={isFullscreen ? btnActive : btnDefault}
          title={isFullscreen ? 'Salir pantalla completa (F)' : 'Pantalla completa (F)'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <div className="w-px h-5 bg-[rgba(142, 104, 73,0.15)]" />

        {/* Modo reproducción */}
        <button
          onClick={() => startPlayback(false)}
          className={btnDefault}
          title="Modo reproducción"
          aria-label="Iniciar modo reproducción"
        >
          <Play size={16} className="translate-x-px" />
        </button>
      </div>
    </div>
  );
}
