'use client';

import BrandLogo from '@/components/brand-logo';

export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black gap-0">
      <BrandLogo style={{ width: 264 }} />
      <div className="relative w-10 h-10 mt-8 mb-6">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#8E6849', animation: 'loading-ring-spin 1.2s linear infinite' }}
        />
        <div
          className="absolute inset-1 rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'rgba(142, 104, 73,0.3)', animation: 'loading-ring-spin 1.8s linear infinite reverse' }}
        />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#8E6849', animation: `loading-pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
