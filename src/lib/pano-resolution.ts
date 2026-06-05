// Decide que resolucion de panorama servir segun el dispositivo.
//
// Escritorio con GPU capaz -> 8000x4000 (maxima nitidez).
// Movil / GPU con limite de textura bajo -> 4096x2048 (en panoramas/.../mobile/).
//
// La senal decisiva es el limite real de textura de la GPU (MAX_TEXTURE_SIZE):
// si es < 8192 el equipo NO puede usar un equirectangular de 8000px como una sola
// textura — lo decodificaria entero (32 MP) para luego reducirlo a la fuerza, con
// el consiguiente jank y pico de memoria. Tambien bajamos de resolucion en
// pantallas pequenas para no malgastar ~6 MB de descarga en datos moviles.

let cached: boolean | null = null;

function detectLowRes(): boolean {
  if (typeof window === 'undefined') return false;

  // 1) Limite de textura de la GPU — la senal mas fiable.
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      if (maxTex && maxTex < 8192) return true;
    }
  } catch {
    /* ignore — caemos al heuristico de tamano */
  }

  // 2) Pantalla pequena (telefonos) — ahorra descarga aunque la GPU aguante.
  const w = window.screen?.width ?? window.innerWidth;
  const h = window.screen?.height ?? window.innerHeight;
  const minSide = Math.min(w, h);
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  if (coarse && minSide <= 820) return true;

  return false;
}

/** True si conviene servir los panoramas en baja resolucion (4096x2048). */
export function useLowResPanoramas(): boolean {
  if (cached === null) cached = detectLowRes();
  return cached;
}

/**
 * Reescribe la URL de un panorama del tour a su variante movil insertando
 * `/mobile/` antes del nombre de archivo. Funciona tanto para los amueblados
 * (casa-grande/x.jpg) como para obra gris (casa-grande/obra-gris/x.jpg).
 * Devuelve la URL sin cambios si ya apunta a /mobile/.
 */
export function resolvePanoramaUrl(url: string): string {
  if (!useLowResPanoramas()) return url;
  if (url.includes('/mobile/')) return url;
  return url.replace(/\/([^/]+\.jpe?g)(\?.*)?$/i, '/mobile/$1$2');
}
