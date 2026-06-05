'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTourStore } from '@/lib/tour-store';
import { Bed, Bath, Maximize2, Eye, ArrowRight, Clock } from 'lucide-react';
import type { BuildingConfig, ApartmentConfig } from '@/lib/tour-types';
import { assetPath } from '@/lib/asset-path';
import BrandLogo from '@/components/brand-logo';

/**
 * Un apartamento se considera "disponible" si:
 * 1. Su campo `available` es explicitamente true (o no esta definido), Y
 * 2. Tiene al menos una escena cuya ruta de panorama no sea un placeholder.
 *
 * Si `available === false` en el config, siempre se oculta sin importar las escenas.
 * Los apartamentos con panoramas pendientes se muestran como "Proxim." en el selector.
 */
function isApartmentAvailable(apt: ApartmentConfig): boolean {
  // Campo explicit: false siempre oculta
  if (apt.available === false) return false;
  // Campo explicit: true siempre muestra (el dev confirma que tiene panoramas)
  if (apt.available === true) return true;
  // Auto-detect: tiene al menos una escena con ruta de panorama no-placeholder
  return apt.scenes.length > 0 && apt.scenes.some((s) => {
    const pano = s.panorama ?? '';
    return pano.length > 0 && !pano.includes('_placeholder_') && !pano.includes('placeholder.jpg');
  });
}

const BEIGE = '#8E6849';

export default function BuildingSelector() {
  const { config, setApartment } = useTourStore();
  const [hoveredApt, setHoveredApt] = useState<string | null>(null);

  /* ── Modo debug (?debug=1): arrastrar el ojo para recolocarlo ──
     Se resuelve DESPUÉS de montar para no romper la hidratación (el server
     no conoce window.location → debe coincidir con el primer render cliente). */
  const [debugEnabled, setDebugEnabled] = useState(false);
  useEffect(() => {
    setDebugEnabled(window.location.search.includes('debug=1'));
  }, []);
  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!dragId) return;
    const onMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(100, Math.round((e.clientX / window.innerWidth) * 1000) / 10));
      const y = Math.max(0, Math.min(100, Math.round((e.clientY / window.innerHeight) * 1000) / 10));
      setOverrides((prev) => ({ ...prev, [dragId]: { x, y } }));
    };
    const onUp = () => setDragId(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragId]);

  const copyHotspot = useCallback((aptId: string, x: number, y: number) => {
    try {
      navigator.clipboard.writeText(`hotspotX: ${x}, hotspotY: ${y},`);
      setCopied(aptId);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }, []);

  const buildings = config.buildings;
  if (!buildings.length) return null;

  const currentBuilding = buildings[0];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black overflow-hidden"
      style={{ animation: 'selectorFadeIn 0.9s cubic-bezier(0.4,0,0.2,1) both' }}
    >
      {/* ── Background image ── */}
      <div className="absolute inset-0">
        <img
          src={assetPath('/building.png')}
          alt="Edificio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* ── Top header ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 md:px-8 py-4 md:py-5">
        <BrandLogo className="h-[80px] md:h-[104px]" style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.55))' }} />

        {/* Branding Constructora Meléndez */}
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="uppercase"
            style={{
              fontSize: 9,
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 600,
            }}
          >
            Un proyecto de
          </span>
          <img
            src={assetPath('/projects/melendez/branding/LogoMelendezHorizontal.png')}
            alt="Constructora Meléndez"
            className="h-[38px] md:h-[48px]"
            style={{ width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }}
            draggable={false}
          />
        </div>
      </div>

      {/* ── Hotspots con card en hover ── */}
      <div className="absolute inset-0 z-[5]">
        {currentBuilding.apartments.map((apt) => {
          const available = isApartmentAvailable(apt);
          return (
            <BuildingHotspot
              key={apt.id}
              apt={apt}
              building={currentBuilding}
              available={available}
              isHovered={hoveredApt === apt.id}
              onHover={() => setHoveredApt(apt.id)}
              onLeave={() => setHoveredApt(null)}
              onClick={() => available && setApartment(apt)}
              debugEnabled={debugEnabled}
              override={overrides[apt.id]}
              isDragging={dragId === apt.id}
              onDragStart={() => setDragId(apt.id)}
              onCopy={(x, y) => copyHotspot(apt.id, x, y)}
              copied={copied === apt.id}
            />
          );
        })}
      </div>

      {/* ── Hint de debug (solo ?debug=1) ── */}
      {debugEnabled && (
        <div
          className="absolute z-[30] left-4 bottom-4 select-none"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 11,
            color: '#5DD5F0',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(93,213,240,0.5)',
            borderRadius: 8,
            padding: '7px 11px',
            lineHeight: 1.5,
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}
        >
          <b>DEBUG</b> · arrastra el <b>ojo</b> para recolocarlo · luego pulsa{' '}
          <b>copiar</b> y pega <code>hotspotX/hotspotY</code> en tour.config.ts
        </div>
      )}

      <style>{`
        @keyframes selectorFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Building Hotspot — esfera + card en hover
// ═══════════════════════════════════════════════════════════════════
function BuildingHotspot({
  apt, building, available, isHovered, onHover, onLeave, onClick,
  debugEnabled = false, override, isDragging = false, onDragStart, onCopy, copied = false,
}: {
  apt: ApartmentConfig;
  building: BuildingConfig;
  available: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  debugEnabled?: boolean;
  override?: { x: number; y: number };
  isDragging?: boolean;
  onDragStart?: () => void;
  onCopy?: (x: number, y: number) => void;
  copied?: boolean;
}) {
  const floors = building.floors;
  const aptPerFloor = building.apartmentsPerFloor;
  const baseX = override?.x ?? apt.hotspotX ?? (aptPerFloor === 1 ? 50 : apt.position === 0 ? 38 : 62);
  const baseY = override?.y ?? apt.hotspotY ?? (65 - (apt.floor / (floors - 1 || 1)) * 35);

  // Decide si la card abre hacia la izquierda o derecha según posición horizontal
  const cardAlignRight = baseX > 55;

  return (
    <div
      className="absolute"
      style={{ left: `${baseX}%`, top: `${baseY}%`, transform: 'translate(-50%, -50%)' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* ── Card flotante — aparece arriba del hotspot ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 'calc(100% + 18px)',
          left: cardAlignRight ? 'auto' : '50%',
          right: cardAlignRight ? '50%' : 'auto',
          opacity: isHovered ? 1 : 0,
          transform: `translateX(${cardAlignRight ? '50%' : '-50%'}) translateY(${isHovered ? '0px' : '8px'})`,
          transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          width: 220,
          zIndex: 20,
          pointerEvents: isHovered ? 'all' : 'none',
        }}
      >
        <div
          className="rounded-2xl border p-4 backdrop-blur-xl"
          style={{
            background: 'rgba(26, 16, 8,0.88)',
            borderColor: `${BEIGE}30`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${BEIGE}10`,
          }}
        >
          {/* Nombre */}
          <h4 className="font-serif text-base font-bold text-white mb-1">{apt.name}</h4>
          <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {apt.description}
          </p>

          {/* Specs */}
          <div className="flex items-center gap-3 mb-4 text-[11px]" style={{ color: `${BEIGE}80` }}>
            <span className="flex items-center gap-1"><Bed size={12} /> {apt.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath size={12} /> {apt.bathrooms}</span>
            <span className="flex items-center gap-1"><Maximize2 size={12} /> {apt.area}m²</span>
          </div>

          {/* CTA */}
          {available ? (
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 cursor-pointer hover:brightness-110"
              style={{ background: `${BEIGE}18`, color: '#FFF9E9', border: `1px solid ${BEIGE}30` }}
              onClick={() => { if (!debugEnabled) onClick(); }}
            >
              Iniciar Recorrido
              <ArrowRight size={13} />
            </button>
          ) : (
            <div
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold select-none"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Clock size={13} />
              Próximamente
            </div>
          )}
        </div>

        {/* Conector triangular hacia el hotspot */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid rgba(26, 16, 8,0.88)`,
          }}
        />
      </div>

      {/* ── Esfera principal ── */}
      <button
        className="relative z-10"
        style={{
          cursor: debugEnabled ? (isDragging ? 'grabbing' : 'grab') : available ? 'pointer' : 'default',
        }}
        onMouseDown={(e) => {
          if (debugEnabled) {
            e.preventDefault();
            onDragStart?.();
          }
        }}
        onClick={() => {
          // En debug NO navegamos: el clic/arrastre solo recoloca el ojo.
          if (!debugEnabled) onClick();
        }}
        tabIndex={-1}
        aria-disabled={!available}
      >
        {/* Pulse ring — solo si disponible */}
        {available && (
          <div
            className="absolute -inset-3 rounded-full border-2"
            style={{
              borderColor: `${BEIGE}60`,
              animation: 'building-pulse 2.5s ease-out infinite',
            }}
          />
        )}

        {/* Círculo */}
        <div
          className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: available
              ? (isHovered ? 'rgba(58,32,9,0.6)' : 'rgba(42,23,7,0.5)')
              : 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: available
              ? '2px solid #FFF9E9'
              : '2px solid rgba(255,255,255,0.2)',
            transform: available && isHovered ? 'scale(1.2)' : 'scale(1)',
            boxShadow: available && isHovered
              ? `0 0 32px ${BEIGE}80, 0 0 0 3px ${BEIGE}30`
              : available
                ? `0 0 14px ${BEIGE}40`
                : 'none',
          }}
        >
          {available
            ? <Eye size={26} style={{ color: '#FFF9E9' }} />
            : <Clock size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />
          }
        </div>

        {/* Nombre debajo siempre visible */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            textAlign: 'center',
            opacity: isHovered ? 0 : 0.85,
            transition: 'opacity 0.2s ease',
          }}
        >
          <span
            className="text-[14px] font-semibold px-3 py-1.5 rounded-xl leading-snug"
            style={{
              display: 'block',
              background: 'rgba(0,0,0,0.65)',
              color: available ? '#FFF9E9' : 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${available ? `${BEIGE}18` : 'rgba(255,255,255,0.10)'}`,
            }}
          >
            {apt.name}
          </span>
        </div>
      </button>

      {/* ── Lectura de coords + copiar (solo ?debug=1) ── */}
      {debugEnabled && (
        <div
          className="absolute z-[30]"
          style={{
            left: 'calc(100% + 12px)',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 11,
            color: '#5DD5F0',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(93,213,240,0.5)',
            borderRadius: 6,
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          <span>
            x:<b style={{ color: '#FFF' }}>{baseX}</b> y:<b style={{ color: '#FFF' }}>{baseY}</b>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy?.(baseX, baseY); }}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              background: 'rgba(93,213,240,0.18)',
              border: '1px solid rgba(93,213,240,0.5)',
              borderRadius: 4,
              color: '#5DD5F0',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {copied ? '✓' : 'copiar'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes building-pulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2);   opacity: 0; }
        }
      `}</style>
    </div>
  );
}
