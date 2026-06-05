'use client';

import { useEffect, useState } from 'react';
import { assetPath } from '@/lib/asset-path';
import BrandLogo from '@/components/brand-logo';

const BRAND = (path: string) => assetPath(`/projects/melendez/branding/${path}`);

// Paleta Reserva de Mirriñao — presentación sobre fondo claro (crema)
const BG       = '#FFF9E9'; // crema
const MARRON   = '#4B2C10'; // marrón oscuro (texto)
const MOSTAZA  = '#CB9415'; // mostaza (acento)
const CARAMELO = '#8E6849'; // caramelo (líneas/anillos)

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 2800);
    const doneTimer = setTimeout(() => onComplete(), 3600);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const visible = phase !== 'enter';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 1s cubic-bezier(0.4,0,0.2,1)' : 'none',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Ambient glow cálido */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 45%, ${CARAMELO}14 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Orbit rings */}
      <div style={{
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: '50%',
        border: `1px solid ${CARAMELO}33`,
        animation: 'splash-orbit 4s linear infinite',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease 0.5s',
      }} />
      <div style={{
        position: 'absolute',
        width: 290,
        height: 290,
        borderRadius: '50%',
        border: `1px solid ${CARAMELO}1F`,
        animation: 'splash-orbit 6s linear infinite reverse',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease 0.7s',
      }} />

      {/* Logo a color — centrado exacto */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.78) translateY(14px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.7s ease',
      }}>
        <BrandLogo
          mode="color"
          variant="vertical"
          style={{
            width: 230,
            filter: 'drop-shadow(0 8px 24px rgba(75,44,16,0.18))',
          }}
        />
      </div>

      {/* Tagline + progress — absoluto debajo del logo */}
      <div style={{
        position: 'absolute',
        top: 'calc(50% + 188px)',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease 0.9s',
      }}>
        <div style={{
          width: 140,
          height: 1.5,
          background: `${MOSTAZA}33`,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${MOSTAZA}, transparent)`,
            transformOrigin: 'left center',
            animation: visible ? 'splash-progress 2.4s ease-out 0.3s both' : 'none',
          }} />
        </div>
        <p style={{
          margin: 0,
          color: CARAMELO,
          fontSize: 10,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Recorrido Virtual 360°
        </p>
      </div>

      {/* Co-branding footer */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s ease 1.1s',
      }}>
        <span style={{
          fontSize: 9,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: `${MARRON}99`,
          fontWeight: 600,
        }}>
          Un proyecto de
        </span>
        <img
          src={BRAND('LogoMelendezHorizontal.png')}
          alt="Constructora Meléndez"
          style={{ height: 26, width: 'auto', objectFit: 'contain' }}
          draggable={false}
        />
        <div style={{ width: 1, height: 18, background: `${CARAMELO}40` }} />
        <img
          src={BRAND('MIES LOGO_Horizontal Negro.png')}
          alt="MIESGROUP"
          style={{ height: 20, width: 'auto', objectFit: 'contain' }}
          draggable={false}
        />
      </div>

      <style>{`
        @keyframes splash-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes splash-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
