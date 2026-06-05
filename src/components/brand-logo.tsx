'use client';

import type { CSSProperties } from 'react';
import { assetPath } from '@/lib/asset-path';

// Logo oficial del proyecto: "Reserva de Mirriñao" (Constructora Meléndez).
// Versiones transparentes a color procesadas desde 02_Branding/Logos.
const LOGOS = {
  vertical: assetPath('/projects/melendez/mirrinao/branding/logo-vertical-color.png'),
  horizontal: assetPath('/projects/melendez/mirrinao/branding/logo-horizontal-color.png'),
} as const;

// Relación de aspecto (ancho/alto) de cada versión, tras recortar márgenes.
const RATIO = { vertical: 595 / 558, horizontal: 891 / 575 } as const;

interface Props {
  className?: string;
  style?: CSSProperties;
  /** Orientación del logo. Default: vertical (tríptico + wordmark debajo). */
  variant?: 'vertical' | 'horizontal';
  /**
   * 'color' = logo a color como <img> (para fondos claros: splash crema).
   * 'mono'  = silueta teñida de un color sólido vía mask (para fondos oscuros).
   * Default 'mono' porque casi todo el UI es oscuro y el wordmark a color es marrón.
   */
  mode?: 'color' | 'mono';
  /** Color de la silueta en mode='mono'. Default: crema de marca. */
  color?: string;
}

/**
 * Logo "Reserva de Mirriñao".
 *
 * - mode='color': renderiza el PNG a color (tríptico olivo/mostaza/caramelo +
 *   wordmark marrón). Solo legible sobre fondos claros (p. ej. splash crema).
 * - mode='mono': tiñe la silueta del logo a un color sólido (crema por defecto)
 *   mediante mask-image; ideal sobre los paneles oscuros del recorrido.
 *
 * Define solo width o height en `style`/`className`; la otra dimensión se calcula
 * sola a partir de la relación de aspecto.
 */
export default function BrandLogo({
  className,
  style,
  variant = 'vertical',
  mode = 'mono',
  color = '#FFF9E9',
}: Props) {
  const src = LOGOS[variant];

  if (mode === 'color') {
    return (
      <img
        src={src}
        alt="Reserva de Mirriñao"
        draggable={false}
        className={className}
        style={{ display: 'block', objectFit: 'contain', ...style }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="Reserva de Mirriñao"
      className={className}
      style={{
        display: 'block',
        aspectRatio: String(RATIO[variant]),
        backgroundColor: color,
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        ...style,
      }}
    />
  );
}
