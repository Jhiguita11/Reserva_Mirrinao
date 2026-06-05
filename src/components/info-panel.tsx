'use client';

import { useTourStore } from '@/lib/tour-store';
import { X, Info } from 'lucide-react';
import { useEffect } from 'react';

export default function InfoPanel() {
  const {
    showInfoPanel,
    infoPanelData,
    hideInfo,
  } = useTourStore();

  // Close on Escape
  useEffect(() => {
    if (!showInfoPanel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideInfo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showInfoPanel, hideInfo]);

  if (!showInfoPanel || !infoPanelData) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[110] bg-black/30"
        onClick={hideInfo}
        aria-hidden="true"
      />

      {/* Panel Card */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[111] w-full max-w-lg px-4
                   animate-slide-down-fade"
        role="dialog"
        aria-modal="true"
        aria-label="Information"
      >
        <div
          className="relative flex items-start gap-4 p-5 rounded-2xl
                     bg-black/60 backdrop-blur-xl
                     border border-[rgba(142, 104, 73,0.15)]
                     shadow-2xl shadow-black/40"
        >
          {/* Icon circle */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(142, 104, 73,0.12)', border: '1px solid rgba(142, 104, 73,0.25)' }}
          >
            <Info className="w-5 h-5" style={{ color: '#FFF9E9' }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-snug">
              {infoPanelData.title}
            </h3>
            {infoPanelData.description && (
              <p className="mt-1.5 text-sm text-white/60 leading-relaxed">
                {infoPanelData.description}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={hideInfo}
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0
                       text-white/50 hover:text-white hover:bg-white/10
                       transition-colors duration-150"
            aria-label="Close info panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

    </>
  );
}
