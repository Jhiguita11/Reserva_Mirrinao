'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';
import { sceneTotalMs, PLAYBACK_LEAD_IN } from '@/lib/playback-utils';
import BrandLogo from '@/components/brand-logo';

/** Duración de la animación de entrada (ms). */
const INTRO_MS = 2600;

export default function PlaybackOverlay() {
  const stopPlayback  = useTourStore((s) => s.stopPlayback);
  const nextScene     = useTourStore((s) => s.nextScene);
  const prevScene     = useTourStore((s) => s.prevScene);
  const currentSceneId    = useTourStore((s) => s.currentSceneId);
  const currentSceneIndex = useTourStore((s) => s.currentSceneIndex);
  const selectedApartment = useTourStore((s) => s.selectedApartment);
  const playbackSettings  = useTourStore((s) => s.config.playback);

  const scenes = selectedApartment?.scenes ?? [];
  const currentScene = scenes.find((s) => s.id === currentSceneId);
  const total = scenes.length;

  // Duración real de la escena actual — sincroniza la barra con el avance.
  // Debe usar los mismos ajustes (playbackSettings) que el motor de cámara
  // y el timer de use-playback, o la barra se desalinea con la animación.
  const sceneDurationMs = sceneTotalMs(currentScene?.playbackAnimations ?? [], playbackSettings) + PLAYBACK_LEAD_IN;

  // Animación de entrada — se muestra al montar (al activar el modo reproducción)
  const [showIntro, setShowIntro] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), INTRO_MS);
    return () => clearTimeout(t);
  }, []);

  // Escape para salir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopPlayback();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stopPlayback]);

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none select-none">

      {/* ── Animación de entrada (intro cinematográfica) ── */}
      {showIntro && (
        <div
          className="absolute inset-0 z-[20] flex flex-col items-center justify-center"
          style={{ animation: `playback-intro-bg ${INTRO_MS}ms ease-in-out forwards` }}
        >
          <BrandLogo
            style={{
              width: 220,
              animation: 'playback-intro-logo 2.6s cubic-bezier(0.22,1,0.36,1) forwards',
            }}
          />
          {/* Línea divisoria que se expande */}
          <div
            style={{
              height: 1,
              background: 'rgba(142, 104, 73,0.5)',
              marginTop: 24,
              marginBottom: 16,
              animation: 'playback-intro-line 2.6s cubic-bezier(0.22,1,0.36,1) forwards',
            }}
          />
          <span
            className="uppercase"
            style={{
              fontSize: 13,
              letterSpacing: '0.35em',
              color: 'rgba(255, 249, 233,0.7)',
              fontWeight: 600,
              animation: 'playback-intro-sub 2.6s ease 0.3s both',
            }}
          >
            Recorrido Virtual 360°
          </span>
        </div>
      )}

      {/* Gradiente inferior — fondo para el título */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '55%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
        }}
      />

      {/* Botón salir — esquina superior derecha */}
      <button
        onClick={stopPlayback}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto rounded-full px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(142, 104, 73,0.25)',
          color: 'rgba(255, 249, 233,0.85)',
          backdropFilter: 'blur(12px)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
        aria-label="Salir del modo reproducción"
      >
        <X size={14} />
        <span className="hidden sm:inline">Salir</span>
      </button>

      {/* Bloque central — título de la escena */}
      <div
        key={currentSceneId}
        className="absolute left-0 right-0 flex flex-col items-center justify-center gap-3 px-8"
        style={{
          bottom: 80,
          animation: 'playback-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Contador de escenas */}
        <span
          className="tracking-[0.25em] uppercase"
          style={{ fontSize: 11, color: 'rgba(255, 249, 233,0.5)', fontWeight: 600 }}
        >
          {currentSceneIndex + 1} / {total}
        </span>

        {/* Nombre de la escena */}
        <h2
          className="text-center font-extrabold tracking-tight leading-none"
          style={{
            fontSize: 'clamp(32px, 8vw, 56px)',
            color: '#FFF9E9',
            textShadow: '0 2px 24px rgba(0,0,0,0.6)',
          }}
        >
          {currentScene?.name ?? ''}
        </h2>

        {/* Subtítulo — apartamento */}
        <p
          className="tracking-widest uppercase"
          style={{ fontSize: 12, color: 'rgba(255, 249, 233,0.45)', fontWeight: 600 }}
        >
          {selectedApartment?.name ?? ''}
        </p>
      </div>

      {/* Controles de navegación manual + barra de progreso */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-auto"
        style={{ padding: '0 20px 20px' }}
      >
        {/* Barra de progreso */}
        <div
          className="w-full rounded-full overflow-hidden mb-4"
          style={{ height: 3, background: 'rgba(142, 104, 73,0.15)' }}
        >
          <div
            key={currentSceneId}
            className="h-full rounded-full"
            style={{
              background: '#8E6849',
              animation: `playback-progress ${sceneDurationMs}ms linear forwards`,
              transformOrigin: 'left center',
            }}
          />
        </div>

        {/* Fila inferior: prev / nombre corto / next */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={prevScene}
            className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              width: 40, height: 40,
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(142, 104, 73,0.2)',
              color: 'rgba(255, 249, 233,0.7)',
            }}
            aria-label="Escena anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => useTourStore.getState().setCurrentScene(s.id)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentSceneIndex ? 24 : 7,
                  height: 7,
                  background: i === currentSceneIndex ? '#8E6849' : 'rgba(142, 104, 73,0.3)',
                }}
                aria-label={s.name}
              />
            ))}
          </div>

          <button
            onClick={nextScene}
            className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              width: 40, height: 40,
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(142, 104, 73,0.2)',
              color: 'rgba(255, 249, 233,0.7)',
            }}
            aria-label="Escena siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes playback-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes playback-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        /* ── Intro ── */
        @keyframes playback-intro-bg {
          0%   { opacity: 0; background: rgba(8,8,8,0.96); }
          12%  { opacity: 1; background: rgba(8,8,8,0.96); }
          72%  { opacity: 1; background: rgba(8,8,8,0.92); }
          100% { opacity: 0; background: rgba(8,8,8,0); }
        }
        @keyframes playback-intro-logo {
          0%   { opacity: 0; transform: scale(0.92) translateY(8px); }
          18%  { opacity: 1; transform: scale(1) translateY(0); }
          78%  { opacity: 1; transform: scale(1.02) translateY(0); }
          100% { opacity: 0; transform: scale(1.05) translateY(0); }
        }
        @keyframes playback-intro-line {
          0%   { width: 0px; opacity: 0; }
          25%  { width: 180px; opacity: 1; }
          78%  { width: 180px; opacity: 1; }
          100% { width: 180px; opacity: 0; }
        }
        @keyframes playback-intro-sub {
          0%   { opacity: 0; transform: translateY(6px); letter-spacing: 0.2em; }
          30%  { opacity: 1; transform: translateY(0); letter-spacing: 0.35em; }
          78%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
