'use client';

import { useTourStore } from '@/lib/tour-store';
import { X, Eye, Building2 } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

export default function SceneSelector() {
  const {
    config,
    selectedApartment,
    currentSceneId,
    showSceneList,
    toggleSceneList,
    setCurrentScene,
  } = useTourStore();

  const scenes = selectedApartment?.scenes ?? [];
  const { brand } = config;
  const primary = '#8E6849';
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!showSceneList) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleSceneList();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSceneList, toggleSceneList]);

  // Lock body scroll when open
  useEffect(() => {
    if (showSceneList) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSceneList]);

  const handleSelect = useCallback(
    (id: string) => {
      setCurrentScene(id);
      toggleSceneList();
    },
    [setCurrentScene, toggleSceneList],
  );

  if (!showSceneList) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={toggleSceneList}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 z-[101] h-full w-80 flex flex-col
                   bg-black/70 backdrop-blur-xl border-l border-white/10
                   shadow-2xl shadow-black/40
                   animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Scene selector"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5" style={{ color: primary }} />
            <h2 className="text-base font-semibold text-white tracking-wide">
              Escenas
            </h2>
          </div>
          <button
            onClick={toggleSceneList}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-white/60 hover:text-white hover:bg-white/10
                       transition-colors duration-150"
            aria-label="Close scene list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Section */}
        <div className="px-5 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primary}20` }}
            >
              <Building2 className="w-4 h-4" style={{ color: primary }} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: primary }}>
                {brand.name}
              </p>
              {brand.tagline && (
                <p className="text-[11px] text-white/40 leading-tight mt-0.5">
                  {brand.tagline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scene List */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {scenes.map((scene, index) => {
            const isActive = scene.id === currentSceneId;
            const thumbSrc = scene.thumbnail || scene.panorama;

            return (
              <button
                key={scene.id}
                onClick={() => handleSelect(scene.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left
                            transition-all duration-150 group relative
                            ${isActive
                              ? 'bg-white/[0.07]'
                              : 'hover:bg-white/[0.04]'
                            }`}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                    style={{ backgroundColor: primary }}
                  />
                )}

                {/* Thumbnail */}
                <div
                  className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0
                             ring-1 ring-white/10 group-hover:ring-white/20 transition-all"
                >
                  <img
                    src={thumbSrc}
                    alt={scene.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Number badge */}
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center
                               justify-center text-[10px] font-bold text-white shadow-lg"
                    style={{ backgroundColor: isActive ? primary : `${primary}90` }}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className={`text-sm leading-snug truncate
                               ${isActive ? 'font-bold text-white' : 'font-medium text-white/80 group-hover:text-white'}`}
                  >
                    {scene.name}
                  </p>
                  {scene.description && (
                    <p className="text-xs text-white/40 leading-snug mt-0.5 line-clamp-2">
                      {scene.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-[11px] text-white/30 text-center">
            {scenes.length} escena{scenes.length !== 1 ? 's' : ''} disponible{scenes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

    </>
  );
}
