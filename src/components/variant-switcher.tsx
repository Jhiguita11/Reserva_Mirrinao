'use client';

import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';

export default function VariantSwitcher() {
  const selectedApartment = useTourStore((s) => s.selectedApartment);
  const currentSceneId = useTourStore((s) => s.currentSceneId);
  const selectedVariants = useTourStore((s) => s.selectedVariants);
  const setSceneVariant = useTourStore((s) => s.setSceneVariant);
  const isTransitioning = useTourStore((s) => s.isTransitioning);

  const scene = selectedApartment?.scenes?.find((s) => s.id === currentSceneId);
  const variants = scene?.variants ?? [];

  // Animacion de "pulse" al cambiar de escena para llamar la atencion
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (variants.length < 2) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 2200);
    return () => clearTimeout(t);
  }, [currentSceneId, variants.length]);

  // Si la escena no tiene variantes, no mostramos nada
  if (variants.length < 2) return null;

  // Variante activa: la seleccionada o la primera por defecto
  const activeVariantId = selectedVariants[currentSceneId] ?? variants[0].id;

  const handlePick = (variantId: string) => {
    if (isTransitioning || variantId === activeVariantId) return;
    setSceneVariant(currentSceneId, variantId);
  };

  return (
    <>
      <style>{`
        @keyframes variant-pulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 0 rgba(142, 104, 73,0.0); }
          50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 10px rgba(142, 104, 73,0.18); }
        }
        @keyframes variant-slide-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div
        className="fixed z-[65]"
        style={{
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'variant-slide-in 0.35s ease',
        }}
      >
        <div
          className="flex items-center rounded-full backdrop-blur-xl"
          style={{
            background: 'rgba(10,8,6,0.78)',
            border: '1px solid rgba(142, 104, 73,0.22)',
            padding: 4,
            gap: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: pulse ? 'variant-pulse 1.1s ease-in-out 2' : undefined,
          }}
        >
          {/* Etiqueta izquierda */}
          <div
            className="hidden md:flex items-center gap-1.5 select-none"
            style={{
              padding: '4px 12px 4px 10px',
              color: 'rgba(255, 249, 233,0.55)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            <Layers size={12} />
            Ver como
          </div>

          {/* Pills de variantes (segmented control) */}
          {variants.map((v) => {
            const isActive = v.id === activeVariantId;
            return (
              <button
                key={v.id}
                onClick={() => handlePick(v.id)}
                disabled={isTransitioning}
                className="rounded-full transition-all duration-200"
                style={{
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  cursor: isTransitioning ? 'wait' : isActive ? 'default' : 'pointer',
                  background: isActive ? '#8E6849' : 'transparent',
                  color: isActive ? '#FFF9E9' : 'rgba(142, 104, 73,0.7)',
                  border: 'none',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isTransitioning) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(142, 104, 73,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#FFF9E9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.7)';
                  }
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
