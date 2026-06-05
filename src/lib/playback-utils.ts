import type { PlaybackAnimation, PlaybackSettings } from './tour-types';

// ── Parámetros de movimiento (valores por defecto) ────────────────
/** Velocidad del pan principal (recorrido de la escena) en °/s. Lento = contemplativo. */
export const PAN_SPEED = 9;
/** Velocidad de la transición de conexión entre animaciones en °/s. Más ágil. */
export const TRANSITION_SPEED = 32;
/** Duración de una toma estática (from == to) en ms. */
export const STATIC_HOLD_MS = 3800;
/** Límites de duración del pan principal en ms. */
const PAN_MIN_MS = 3200;
const PAN_MAX_MS = 11000;
/** Límites de duración de la transición en ms. */
const TRANS_MIN_MS = 700;
const TRANS_MAX_MS = 2600;
/** HFOV usado durante el modo reproducción. */
export const PLAYBACK_HFOV = 140;
/** Margen tras el crossfade de entrada antes de empezar a contar el avance. */
export const PLAYBACK_LEAD_IN = 450;

/** Diferencia angular más corta entre dos yaws (resultado en [-180, 180]). */
export function shortYawDiff(from: number, to: number): number {
  let d = ((to - from) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

/** Magnitud del movimiento combinando yaw y pitch (lo que domina visualmente). */
function moveMagnitude(
  from: { pitch: number; yaw: number },
  to: { pitch: number; yaw: number },
): number {
  const dy = Math.abs(shortYawDiff(from.yaw, to.yaw));
  const dp = Math.abs(to.pitch - from.pitch);
  return Math.max(dy, dp);
}

/** Duración del pan principal de una animación, a velocidad constante. */
export function panDurationMs(anim: PlaybackAnimation, s?: PlaybackSettings): number {
  const deg = moveMagnitude(anim.from, anim.to);
  if (deg < 1) return s?.staticHoldMs ?? STATIC_HOLD_MS; // toma estática
  const speed = s?.panSpeed ?? PAN_SPEED;
  return Math.max(PAN_MIN_MS, Math.min(PAN_MAX_MS, (deg / speed) * 1000));
}

/** Duración de la transición de conexión entre el `to` de una y el `from` de la siguiente. */
export function transitionDurationMs(
  fromTo: { pitch: number; yaw: number },
  nextFrom: { pitch: number; yaw: number },
  s?: PlaybackSettings,
): number {
  const deg = moveMagnitude(fromTo, nextFrom);
  if (deg < 1) return 0; // no hay que moverse
  const speed = s?.transitionSpeed ?? TRANSITION_SPEED;
  return Math.max(TRANS_MIN_MS, Math.min(TRANS_MAX_MS, (deg / speed) * 1000));
}

/** Tiempo total que una escena permanece activa en modo reproducción. */
export function sceneTotalMs(anims: PlaybackAnimation[], s?: PlaybackSettings): number {
  if (!anims.length) return 7000;
  let total = 0;
  for (let i = 0; i < anims.length; i++) {
    total += panDurationMs(anims[i], s);
    if (i < anims.length - 1) {
      total += transitionDurationMs(anims[i].to, anims[i + 1].from, s);
    }
  }
  return total;
}

/** Resuelve el HFOV de reproducción desde los ajustes (o el valor por defecto). */
export function playbackHfov(s?: PlaybackSettings): number {
  return s?.hfov ?? PLAYBACK_HFOV;
}

/** Ease-in-out cuadrático — suave para el pan principal. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/** Ease-in-out cúbico — más suave para las transiciones de conexión. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
