'use client';

import { Phone } from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';

export default function CtaButton() {
  const website = useTourStore((s) => s.config.brand.website);
  if (!website) return null;

  return (
    <>
      {/* Móvil: botón redondo en esquina inferior derecha */}
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir al sitio de Constructora Meléndez"
        className="fixed bottom-4 right-4 z-[60] flex md:hidden items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{
          width: 44,
          height: 44,
          background: '#8E6849',
          color: '#FFF9E9',
          boxShadow: '0 4px 20px rgba(142, 104, 73,0.35), 0 2px 8px rgba(0,0,0,0.4)',
          textDecoration: 'none',
        }}
      >
        <Phone size={18} strokeWidth={2.5} />
      </a>

      {/* Desktop: pill con texto en esquina inferior izquierda */}
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir al sitio de Constructora Meléndez"
        className="fixed bottom-6 left-6 z-[60] hidden md:flex items-center gap-2 rounded-2xl font-semibold transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          padding: '10px 18px',
          background: '#8E6849',
          color: '#FFF9E9',
          fontSize: 13,
          boxShadow: '0 4px 24px rgba(142, 104, 73,0.28), 0 2px 8px rgba(0,0,0,0.45)',
          textDecoration: 'none',
        }}
      >
        <Phone size={15} strokeWidth={2.5} />
        Contáctanos
      </a>
    </>
  );
}
