'use client';

import { Eye } from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';
import BrandLogo from '@/components/brand-logo';

interface Props {
  onStart: () => void;
}

export default function TourWelcome({ onStart }: Props) {
  const { selectedApartment, config } = useTourStore();

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center cursor-pointer"
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.92) 100%)' }}
      onClick={onStart}
    >
      <div
        className="absolute bottom-6 left-6"
        style={{ animation: 'welcome-fade-in 0.6s ease 0.2s both' }}
      >
        <BrandLogo style={{ height: 76 }} />
      </div>

      <div
        className="text-center max-w-md px-8"
        style={{ animation: 'welcome-scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <h1
          className="font-serif text-4xl font-bold tracking-tight mb-2"
          style={{ color: '#FFF9E9', animation: 'welcome-fade-up 0.6s ease 0.3s both' }}
        >
          {selectedApartment?.name ?? ''}
        </h1>
        <p
          className="text-sm mb-10 text-white/50"
          style={{ animation: 'welcome-fade-up 0.6s ease 0.4s both' }}
        >
          {selectedApartment?.description ?? ''}
        </p>
        <button
          onClick={e => { e.stopPropagation(); onStart(); }}
          className="group relative px-14 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-3.5 cursor-pointer"
          style={{ background: '#8E6849', color: '#FFF9E9', animation: 'welcome-fade-up 0.6s ease 0.5s both', boxShadow: '0 8px 30px rgba(142, 104, 73,0.45)' }}
        >
          <Eye size={26} />
          Iniciar Recorrido 360°
        </button>
        <p
          className="text-xs mt-6 text-white/20"
          style={{ animation: 'welcome-fade-in 0.6s ease 0.7s both' }}
        >
          Arrastra para explorar · Toca los puntos para navegar
        </p>
      </div>
    </div>
  );
}
