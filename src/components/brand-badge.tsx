'use client';

import { useTourStore } from '@/lib/tour-store';
import BrandLogo from '@/components/brand-logo';

export default function BrandBadge() {
  const { config, selectedApartment } = useTourStore();

  return (
    <div
      className="fixed top-3 right-3 md:top-4 md:right-4 z-[60] flex items-center gap-3 md:gap-3.5 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl backdrop-blur-xl border cursor-default select-none"
      style={{
        background: 'rgba(0,0,0,0.5)',
        borderColor: 'rgba(142, 104, 73,0.12)',
      }}
    >
      <BrandLogo variant="horizontal" className="h-[44px] md:h-[56px]" />
      <div className="w-px self-stretch" style={{ background: 'rgba(142, 104, 73,0.2)' }} />
      <div>
        <p className="text-xs font-bold tracking-wide max-w-[120px] sm:max-w-none truncate" style={{ color: '#FFF9E9' }}>
          {selectedApartment ? selectedApartment.name : config.brand.name}
        </p>
        <p className="hidden sm:block text-[10px] text-white/30">
          {selectedApartment ? config.brand.tagline : 'Recorrido Virtual'}
        </p>
      </div>
    </div>
  );
}
