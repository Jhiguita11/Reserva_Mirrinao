'use client';

export default function HelpHint() {
  return (
    <div
      className="fixed bottom-36 md:bottom-44 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full backdrop-blur-md border text-center pointer-events-none animate-fade-in max-w-[calc(100vw-32px)]"
      style={{
        background: 'rgba(0,0,0,0.4)',
        borderColor: 'rgba(142, 104, 73,0.1)',
      }}
    >
      {/* Móvil: texto corto */}
      <p className="block md:hidden text-[10px]" style={{ color: 'rgba(255, 249, 233,0.45)' }}>
        Arrastra para mirar · Toca los puntos para navegar
      </p>
      {/* Desktop: texto completo */}
      <p className="hidden md:block text-[11px] whitespace-nowrap" style={{ color: 'rgba(255, 249, 233,0.45)' }}>
        Arrastra para mirar · Scroll para zoom · Toca los puntos para navegar
      </p>
    </div>
  );
}
