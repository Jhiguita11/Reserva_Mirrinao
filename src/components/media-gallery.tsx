'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Images, Map } from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';

export default function MediaGallery() {
  const galleryOpen = useTourStore((s) => s.galleryOpen);
  const closeGallery = useTourStore((s) => s.closeGallery);
  const config = useTourStore((s) => s.config);

  const [index, setIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const items =
    galleryOpen === 'gallery'
      ? config.gallery ?? []
      : galleryOpen === 'plantas'
        ? config.plantas ?? []
        : [];

  // Reset al abrir
  useEffect(() => {
    if (galleryOpen) {
      setIndex(0);
      setImgLoaded(false);
    }
  }, [galleryOpen]);

  const total = items.length;
  const current = items[index];

  const goNext = useCallback(() => {
    if (total === 0) return;
    setImgLoaded(false);
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setImgLoaded(false);
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  // Teclado: flechas + Escape
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen, goNext, goPrev, closeGallery]);

  if (!galleryOpen) return null;

  const title = galleryOpen === 'gallery' ? 'Galería' : 'Plantas';
  const IconHeader = galleryOpen === 'gallery' ? Images : Map;

  return (
    <>
      <style>{`
        @keyframes mg-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mg-scale-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        .mg-backdrop { animation: mg-fade-in 0.32s ease both; }
        .mg-stage    { animation: mg-scale-in 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .mg-img-fade { animation: mg-fade-in 0.5s ease both; }
      `}</style>

      <div
        className="mg-backdrop fixed inset-0 z-[10000] flex flex-col"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10,8,6,0.93) 0%, rgba(0,0,0,0.97) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={closeGallery}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(142, 104, 73,0.08)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <IconHeader size={18} className="text-[#FFF9E9]/70" />
            <h2
              className="font-semibold tracking-wide uppercase select-none"
              style={{ color: '#FFF9E9', fontSize: 14, letterSpacing: 2 }}
            >
              {title}
            </h2>
            {total > 0 && (
              <span
                className="ml-2 text-[11px] tracking-wider select-none"
                style={{ color: 'rgba(255, 249, 233,0.45)' }}
              >
                {index + 1} / {total}
              </span>
            )}
          </div>
          <button
            onClick={closeGallery}
            aria-label="Cerrar"
            className="flex items-center justify-center rounded-lg p-2 transition-colors"
            style={{
              color: 'rgba(255, 249, 233,0.7)',
              background: 'rgba(142, 104, 73,0.06)',
              border: '1px solid rgba(142, 104, 73,0.12)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(142, 104, 73,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#FFF9E9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(142, 104, 73,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.7)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Stage */}
        <div
          className="flex-1 flex items-center justify-center px-6 py-6 relative min-h-0"
          onClick={(e) => e.stopPropagation()}
        >
          {total === 0 ? (
            <div className="text-center select-none">
              <p
                className="text-[13px] tracking-wider uppercase mb-2"
                style={{ color: 'rgba(255, 249, 233,0.5)', letterSpacing: 2 }}
              >
                Próximamente
              </p>
              <p className="text-[12px]" style={{ color: 'rgba(255, 249, 233,0.35)' }}>
                {galleryOpen === 'gallery'
                  ? 'Los renders del proyecto se agregarán aquí.'
                  : 'Las plantas del proyecto se agregarán aquí.'}
              </p>
            </div>
          ) : (
            <>
              {/* Flecha izquierda */}
              {total > 1 && (
                <button
                  onClick={goPrev}
                  aria-label="Anterior"
                  className="absolute left-4 md:left-8 z-10 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    width: 52,
                    height: 52,
                    background: 'rgba(10,8,6,0.7)',
                    border: '1px solid rgba(142, 104, 73,0.25)',
                    color: '#FFF9E9',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(142, 104, 73,0.18)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(10,8,6,0.7)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              {/* Flecha derecha */}
              {total > 1 && (
                <button
                  onClick={goNext}
                  aria-label="Siguiente"
                  className="absolute right-4 md:right-8 z-10 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    width: 52,
                    height: 52,
                    background: 'rgba(10,8,6,0.7)',
                    border: '1px solid rgba(142, 104, 73,0.25)',
                    color: '#FFF9E9',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(142, 104, 73,0.18)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(10,8,6,0.7)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <ChevronRight size={22} />
                </button>
              )}

              {/* Imagen */}
              <div className="mg-stage relative max-w-[min(94vw,1400px)] max-h-[78vh] flex items-center justify-center">
                {current && (
                  <img
                    key={current.id}
                    src={current.src}
                    alt={current.title ?? ''}
                    className="mg-img-fade rounded-lg select-none"
                    onLoad={() => setImgLoaded(true)}
                    draggable={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '78vh',
                      objectFit: 'contain',
                      opacity: imgLoaded ? 1 : 0,
                      transition: 'opacity 0.35s ease',
                      boxShadow: '0 16px 60px rgba(0,0,0,0.6)',
                    }}
                  />
                )}
                {/* Caption */}
                {current && (current.title || current.caption) && (
                  <div
                    className="absolute -bottom-12 left-0 right-0 text-center px-4 select-none"
                    style={{ animation: 'mg-fade-in 0.6s ease 0.2s both' }}
                  >
                    {current.title && (
                      <p
                        className="text-[13px] font-semibold tracking-wide"
                        style={{ color: '#FFF9E9' }}
                      >
                        {current.title}
                      </p>
                    )}
                    {current.caption && (
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: 'rgba(255, 249, 233,0.55)' }}
                      >
                        {current.caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails / dots para navegar */}
        {total > 1 && (
          <div
            className="flex items-center justify-center gap-2 pb-6 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => {
                  setImgLoaded(false);
                  setIndex(i);
                }}
                aria-label={`Ir a ${it.title ?? i + 1}`}
                style={{
                  width: i === index ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === index ? '#8E6849' : 'rgba(142, 104, 73,0.3)',
                  transition: 'all 0.25s ease',
                  border: 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
