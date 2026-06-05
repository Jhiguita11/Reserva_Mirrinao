'use client';

import { useEffect } from 'react';

// ─── Sonido de interfaz ─────────────────────────────────────────────────────
// Genera un "clic" suave con la Web Audio API (sin archivos de audio) y lo
// reproduce en cualquier botón / enlace de la app mediante un único listener
// global. El AudioContext se crea de forma perezosa en la primera interacción
// del usuario (gesto), cumpliendo la política de autoplay de los navegadores.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Reproduce un clic corto y discreto. `variant` permite un tono ligeramente
 * distinto para acciones de navegación vs. acciones principales.
 */
export function playClick(variant: 'tap' | 'soft' = 'tap') {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Tono base + envolvente percusiva muy corta (≈70 ms).
  const freq = variant === 'soft' ? 520 : 660;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.06);

  const peak = variant === 'soft' ? 0.035 : 0.055;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * Monta un listener global que reproduce el clic al pulsar cualquier elemento
 * interactivo (button, a, [role="button"]). Llamar una sola vez en la página.
 */
export function useUiSound(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>('button, a, [role="button"]');
      if (!el) return;
      // No sonar en elementos deshabilitados.
      if (el.getAttribute('aria-disabled') === 'true') return;
      if ((el as HTMLButtonElement).disabled) return;
      playClick('tap');
    };

    // pointerdown da una respuesta más inmediata que click.
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [enabled]);
}
