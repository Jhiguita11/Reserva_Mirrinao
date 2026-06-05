'use client';

import { useEffect, useRef } from 'react';
import { useTourStore } from './tour-store';
import { sceneTotalMs, PLAYBACK_LEAD_IN } from './playback-utils';

/**
 * Motor del modo reproducción.
 * Calcula cuánto dura cada escena (suma de sus pans + transiciones) y avanza
 * a la siguiente al terminar. Loop infinito hasta que se sale del modo.
 */
export function usePlayback() {
  const isPlaybackMode    = useTourStore((s) => s.isPlaybackMode);
  const currentSceneId    = useTourStore((s) => s.currentSceneId);
  const currentSceneIndex = useTourStore((s) => s.currentSceneIndex);
  const selectedApartment = useTourStore((s) => s.selectedApartment);
  const playbackSettings  = useTourStore((s) => s.config.playback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isPlaybackMode) return;

    const scene = selectedApartment?.scenes.find((s) => s.id === currentSceneId);
    const anims = scene?.playbackAnimations ?? [];

    // Tiempo de las animaciones + margen para el crossfade de entrada de la escena
    const total = sceneTotalMs(anims, playbackSettings) + PLAYBACK_LEAD_IN;

    timerRef.current = setTimeout(() => {
      const store = useTourStore.getState();
      const scenes = store.selectedApartment?.scenes ?? [];
      if (!scenes.length) return;
      const next = (store.currentSceneIndex + 1) % scenes.length;
      store.setCurrentScene(scenes[next].id);
    }, total);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaybackMode, currentSceneId, currentSceneIndex, selectedApartment, playbackSettings]);
}
