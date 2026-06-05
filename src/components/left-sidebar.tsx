'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ArrowLeft,
  Home,
  Bed,
  Bath,
  Sofa,
  DoorOpen,
  Sun,
  Map,
  PawPrint,
  LayoutGrid,
  Images,
  Glasses,
  Clock,
} from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';
import { assetPath } from '@/lib/asset-path';
import BrandLogo from '@/components/brand-logo';
import type { ApartmentConfig } from '@/lib/tour-types';

/** Misma logica que building-selector: respeta apt.available si esta definido. */
function isApartmentAvailable(apt: ApartmentConfig): boolean {
  if (apt.available === false) return false;
  if (apt.available === true) return true;
  return apt.scenes.length > 0 && apt.scenes.some((s) => {
    const pano = s.panorama ?? '';
    return pano.length > 0 && !pano.includes('_placeholder_') && !pano.includes('placeholder.jpg');
  });
}

// Icono por tipo de habitacion (reutiliza la logica del sidebar anterior)
function getRoomIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('entrada') || n.includes('hall') || n.includes('acceso')) return <DoorOpen size={14} />;
  if (n.includes('sala') || n.includes('estar') || n.includes('comedor')) return <Sofa size={14} />;
  if (n.includes('cocina')) return <Sun size={14} />;
  if (n.includes('dorm') || n.includes('alcoba')) return <Bed size={14} />;
  if (n.includes('bano') || n.includes('bath') || n.includes('wc')) return <Bath size={14} />;
  if (n.includes('terraza') || n.includes('balcon') || n.includes('balcon')) return <Sun size={14} />;
  if (n.includes('mascota') || n.includes('pet') || n.includes('zona')) return <PawPrint size={14} />;
  if (n.includes('espacio') || n.includes('estudio') || n.includes('multiple')) return <LayoutGrid size={14} />;
  return <Home size={14} />;
}

export default function LeftSidebar() {
  const {
    config,
    selectedApartment,
    currentSceneId,
    setCurrentScene,
    setApartment,
    clearApartment,
    showLeftSidebar,
    toggleLeftSidebar,
    openGallery,
  } = useTourStore();

  // Mapeo de scene ID del tour → clave usada en vr.html (MIRRIÑAO — Casa Grande).
  // vr.html usa claves cortas (el ID sin el prefijo 'cg-'). Si la escena activa
  // no está en el mapa, se abre el VR en 'acceso'. Mantener sincronizado con el
  // objeto SCENES de public/vr.html.
  const VR_SCENE_MAP: Record<string, string> = {
    'cg-acceso': 'acceso',
    'cg-sala': 'sala',
    'cg-comedor': 'comedor',
    'cg-cocina-patio': 'cocina-patio',
    'cg-patio-exterior': 'patio-exterior',
    'cg-alcoba-principal': 'alcoba-principal',
    'cg-bano-principal': 'bano-principal',
    'cg-alcoba-auxiliar-1': 'alcoba-auxiliar-1',
    'cg-alcoba-auxiliar-2': 'alcoba-auxiliar-2',
    'cg-bano-social': 'bano-social',
  };
  const vrScene = VR_SCENE_MAP[currentSceneId] ?? 'acceso';
  const vrHref = assetPath(`/vr.html?scene=${vrScene}`);

  // Aviso cuando se intenta entrar a VR fuera de un visor compatible.
  const [showVrWarning, setShowVrWarning] = useState(false);

  // El modo VR (A-Frame/WebXR) requiere el navegador de un visor — en la
  // práctica el de las Oculus/Meta Quest. Validamos por user-agent (Quest)
  // y, como respaldo, si el navegador soporta sesiones WebXR 'immersive-vr'.
  const handleVrClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isQuestUA = /OculusBrowser|Quest|Pico/i.test(ua);
    let xrSupported = false;
    try {
      const xr = (navigator as unknown as { xr?: { isSessionSupported?: (m: string) => Promise<boolean> } }).xr;
      if (xr?.isSessionSupported) {
        xrSupported = await xr.isSessionSupported('immersive-vr');
      }
    } catch {
      xrSupported = false;
    }
    if (isQuestUA || xrSupported) {
      window.location.href = vrHref;
    } else {
      setShowVrWarning(true);
    }
  };

  // ID del apartamento expandido en el panel (puede ser distinto al selectedApartment)
  const [expandedAptId, setExpandedAptId] = useState<string | null>(
    selectedApartment?.id ?? null,
  );

  const apartments = config.buildings.flatMap((b) => b.apartments);

  // Al entrar a un apartamento desde el sidebar, expandir su seccion y navegar
  const handleSelectApartment = (aptId: string) => {
    const apt = apartments.find((a) => a.id === aptId);
    if (!apt) return;
    if (expandedAptId === aptId) {
      // Si ya esta expandido, solo colapsar (no cambiar de apartamento)
      setExpandedAptId(null);
    } else {
      setExpandedAptId(aptId);
      // Solo navegar al apartamento si es distinto al actual
      if (!selectedApartment || selectedApartment.id !== aptId) {
        setApartment(apt);
      }
    }
  };

  // Volver a la seleccion de apartamentos
  const handleInicio = () => {
    clearApartment();
    setExpandedAptId(null);
  };

  // Abrir visor de plantas del proyecto (sin burbujas)
  const handlePlantas = () => {
    openGallery('plantas');
    if (showLeftSidebar) toggleLeftSidebar();
  };

  // Abrir galeria de renders del proyecto
  const handleGaleria = () => {
    openGallery('gallery');
    if (showLeftSidebar) toggleLeftSidebar();
  };

  const isOpen = showLeftSidebar;
  const PANEL_W = 240;

  // Apertura por hover: tab disparador abre, salir del panel cierra.
  const openSidebar = () => {
    if (!showLeftSidebar) toggleLeftSidebar();
  };
  const closeSidebar = () => {
    if (showLeftSidebar) toggleLeftSidebar();
  };

  return (
    <>
      {/* Backdrop móvil — tap fuera cierra el sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[69] md:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      {/* Panel lateral */}
      <div
        onMouseLeave={closeSidebar}
        className="fixed top-0 left-0 h-full z-[70] flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          width: isOpen ? PANEL_W : 0,
          background: 'rgba(10,8,6,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: `1px solid rgba(142, 104, 73,0.12)`,
          boxShadow: isOpen ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Contenido con opacidad ligada al estado open */}
        <div
          className="flex flex-col h-full transition-opacity duration-200"
          style={{
            opacity: isOpen ? 1 : 0,
            minWidth: PANEL_W,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          {/* ── Logo MIRRIÑAO ── */}
          <div
            className="flex flex-col items-center px-5 pt-6 pb-5"
            style={{ borderBottom: '1px solid rgba(142, 104, 73,0.08)' }}
          >
            <BrandLogo style={{ width: 160 }} />
            <span
              className="mt-2 text-[10px] tracking-widest uppercase select-none"
              style={{ color: 'rgba(255, 249, 233,0.35)' }}
            >
              Constructora Meléndez
            </span>
          </div>

          {/* ── Navegacion ── */}
          <nav className="tour-scrollbar flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-2">

            {/* INICIO */}
            <button
              onClick={handleInicio}
              className="flex items-center gap-3 px-5 py-3 w-full text-left transition-all duration-150 group"
              style={{ color: 'rgba(255, 249, 233,0.65)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#FFF9E9';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142, 104, 73,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.65)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <ArrowLeft size={14} className="shrink-0 opacity-70" />
              <span className="text-[12px] font-semibold tracking-widest uppercase">
                Inicio
              </span>
            </button>

            {/* Separador */}
            <div style={{ height: 1, background: 'rgba(142, 104, 73,0.08)', margin: '2px 0' }} />

            {/* Apartamentos */}
            {apartments.map((apt) => {
              const isExpanded = expandedAptId === apt.id;
              const isActive = selectedApartment?.id === apt.id;
              const available = isApartmentAvailable(apt);

              return (
                <div key={apt.id}>
                  {/* Cabecera del apartamento */}
                  <button
                    onClick={() => available && handleSelectApartment(apt.id)}
                    disabled={!available}
                    className="flex items-center gap-3 px-5 py-3 w-full text-left transition-all duration-150"
                    style={{
                      color: !available
                        ? 'rgba(142, 104, 73,0.35)'
                        : isActive ? '#8E6849' : 'rgba(142, 104, 73,0.65)',
                      background: isActive ? 'rgba(142, 104, 73,0.08)' : 'transparent',
                      cursor: available ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && available) {
                        (e.currentTarget as HTMLButtonElement).style.color = '#FFF9E9';
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142, 104, 73,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && available) {
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.65)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {available
                      ? <Home size={14} className="shrink-0" style={{ opacity: isActive ? 1 : 0.6 }} />
                      : <Clock size={14} className="shrink-0" style={{ opacity: 0.5 }} />
                    }
                    <span className="flex-1 text-[12px] font-semibold tracking-widest uppercase truncate">
                      {apt.name}
                    </span>
                    {available ? (
                      <ChevronRight
                        size={14}
                        className="shrink-0 transition-transform duration-200"
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          opacity: 0.5,
                        }}
                      />
                    ) : (
                      <span
                        className="shrink-0 text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(142, 104, 73,0.06)',
                          color: 'rgba(255, 249, 233,0.35)',
                        }}
                      >
                        Próx.
                      </span>
                    )}
                  </button>

                  {/* Escenas del apartamento (submenu) — solo si disponible */}
                  {available && isExpanded && (
                    <div
                      className="flex flex-col"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                    >
                      {apt.scenes.map((scene) => {
                        const isCurrentScene =
                          isActive && scene.id === currentSceneId;

                        return (
                          <button
                            key={scene.id}
                            onClick={() => {
                              // Si el apt no esta seleccionado, seleccionarlo primero
                              if (!isActive) {
                                const fullApt = apartments.find((a) => a.id === apt.id);
                                if (fullApt) setApartment(fullApt);
                              }
                              setCurrentScene(scene.id);
                            }}
                            className="flex items-center gap-3 pl-10 pr-4 py-2.5 w-full text-left transition-all duration-150"
                            style={{
                              color: isCurrentScene
                                ? '#8E6849'
                                : 'rgba(142, 104, 73,0.5)',
                              background: isCurrentScene
                                ? 'rgba(142, 104, 73,0.08)'
                                : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrentScene) {
                                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.85)';
                                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142, 104, 73,0.04)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrentScene) {
                                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.5)';
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              }
                            }}
                          >
                            {/* Icono de tipo de habitacion */}
                            <span
                              className="shrink-0"
                              style={{ opacity: isCurrentScene ? 1 : 0.55 }}
                            >
                              {getRoomIcon(scene.name)}
                            </span>

                            <span className="flex-1 text-[11px] font-medium truncate">
                              {scene.name}
                            </span>

                            {/* Indicador de escena activa */}
                            {isCurrentScene && (
                              <span
                                className="shrink-0 w-1.5 h-1.5 rounded-full"
                                style={{ background: '#8E6849' }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Separador entre apartamentos */}
                  <div
                    style={{ height: 1, background: 'rgba(142, 104, 73,0.08)', margin: '2px 0' }}
                  />
                </div>
              );
            })}

            {/* GALERIA */}
            <button
              onClick={handleGaleria}
              className="flex items-center gap-3 px-5 py-3 w-full text-left transition-all duration-150"
              style={{ color: 'rgba(255, 249, 233,0.65)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#FFF9E9';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142, 104, 73,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.65)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <Images size={14} className="shrink-0 opacity-70" />
              <span className="text-[12px] font-semibold tracking-widest uppercase">
                Galería
              </span>
            </button>

            {/* Separador */}
            <div style={{ height: 1, background: 'rgba(142, 104, 73,0.08)', margin: '2px 0' }} />

            {/* PLANTAS — abre el visor de plantas del proyecto */}
            <button
              onClick={handlePlantas}
              className="flex items-center gap-3 px-5 py-3 w-full text-left transition-all duration-150"
              style={{ color: 'rgba(255, 249, 233,0.65)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#FFF9E9';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(142, 104, 73,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 249, 233,0.65)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <Map size={14} className="shrink-0 opacity-70" />
              <span className="text-[12px] font-semibold tracking-widest uppercase">
                Plantas
              </span>
            </button>

            {/* Separador */}
            <div style={{ height: 1, background: 'rgba(142, 104, 73,0.08)', margin: '2px 0' }} />

            {/* REALIDAD VIRTUAL — página A-Frame estática (Oculus Quest) */}
            <a
              href={vrHref}
              onClick={handleVrClick}
              className="flex items-center gap-3 px-5 py-3 w-full text-left transition-all duration-150"
              style={{ color: 'rgba(255, 249, 233,0.65)', textDecoration: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#FFF9E9';
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(142, 104, 73,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255, 249, 233,0.65)';
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              <Glasses size={14} className="shrink-0 opacity-70" />
              <span className="text-[12px] font-semibold tracking-widest uppercase">
                Realidad Virtual
              </span>
            </a>

          </nav>

          {/* ── Aviso legal con scroll ── */}
          <div
            className="px-5 py-3"
            style={{ borderTop: '1px solid rgba(142, 104, 73,0.08)' }}
          >
            <p
              className="tour-scrollbar overflow-y-auto pr-1 text-justify"
              style={{
                maxHeight: 96,
                fontSize: 9,
                lineHeight: 1.5,
                color: 'rgba(255, 249, 233,0.35)',
              }}
            >
              Las imágenes utilizadas en la promoción del proyecto MIRRIÑAO son
              representaciones digitales de referencia y, al igual que los apartamentos
              modelo de CONSTRUCTORA MELÉNDEZ, pueden diferir en su diseño y construcción
              final. Las áreas privadas y construidas están sujetas a ajustes por razones
              técnicas o por modificaciones requeridas en la licencia de construcción por
              la Curaduría o la Alcaldía correspondiente. La decoración, muebles,
              electrodomésticos, gasodomésticos, acabados y otros elementos mostrados en
              las imágenes o en el apartamento modelo son para ilustrar la distribución de
              los espacios y no forman parte del apartamento. Los acabados y
              especificaciones finales serán los que se acuerden y firmen en el momento de
              compra.
            </p>
          </div>

          {/* ── Branding al fondo: Constructora + Productor ── */}
          <div
            className="px-5 py-5 flex flex-col items-center"
            style={{ borderTop: '1px solid rgba(142, 104, 73,0.08)' }}
          >
            {/* Constructora Meléndez */}
            <span
              className="uppercase"
              style={{
                fontSize: 8,
                letterSpacing: '0.3em',
                color: 'rgba(255, 249, 233,0.35)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Construido por
            </span>
            <img
              src={assetPath('/projects/melendez/branding/LogoMelendezHorizontal.png')}
              alt="Constructora Meléndez"
              style={{ height: 42, width: 'auto', opacity: 0.92 }}
              draggable={false}
            />

            {/* Separador */}
            <div
              style={{
                width: 40,
                height: 1,
                background: 'rgba(142, 104, 73,0.12)',
                margin: '16px 0',
              }}
            />

            {/* Productor del tour — MIESGROUP */}
            <span
              className="uppercase"
              style={{
                fontSize: 8,
                letterSpacing: '0.3em',
                color: 'rgba(255, 249, 233,0.35)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Tour virtual 360° por
            </span>
            <img
              src={assetPath('/projects/melendez/branding/MIES LOGO_Horizontal Blanco.png')}
              alt="MIESGROUP 3D Studio"
              style={{ height: 16, width: 'auto', opacity: 0.7 }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* ── Tab disparador (hover en desktop, tap en móvil) ── */}
      <div
        onMouseEnter={openSidebar}
        onClick={openSidebar}
        aria-label="Abrir menu lateral"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openSidebar()}
        className="fixed top-1/2 z-[71] flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto"
        style={{
          left: isOpen ? PANEL_W : 0,
          transform: 'translateY(-50%)',
          width: 22,
          height: 64,
          background: isOpen ? 'rgba(10,8,6,0)' : 'rgba(10,8,6,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: isOpen ? 'none' : '1px solid rgba(142, 104, 73,0.12)',
          borderRight: isOpen ? 'none' : '1px solid rgba(142, 104, 73,0.12)',
          borderBottom: isOpen ? 'none' : '1px solid rgba(142, 104, 73,0.12)',
          borderLeft: 'none',
          borderRadius: '0 6px 6px 0',
          color: 'rgba(255, 249, 233,0.55)',
          cursor: isOpen ? 'default' : 'pointer',
        }}
      >
        {!isOpen && <ChevronRight size={12} />}
      </div>

      {/* Zona de captura ancha invisible para facilitar el hover del tab */}
      {!isOpen && (
        <div
          onMouseEnter={openSidebar}
          aria-hidden
          className="fixed top-0 left-0 h-full z-[69]"
          style={{ width: 12, background: 'transparent', cursor: 'pointer' }}
        />
      )}

      {/* ── Aviso: modo VR solo disponible en visor Oculus Quest ── */}
      {showVrWarning && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-6"
          style={{ background: 'rgba(10,8,6,0.78)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowVrWarning(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center text-center"
            style={{
              maxWidth: 420,
              width: '100%',
              background: 'rgba(20,16,12,0.98)',
              border: '1px solid rgba(142, 104, 73,0.35)',
              borderRadius: 18,
              padding: '36px 32px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 72,
                height: 72,
                marginBottom: 20,
                background: 'rgba(142, 104, 73,0.18)',
                border: '2px solid #FFF9E9',
              }}
            >
              <Glasses size={32} style={{ color: '#FFF9E9' }} />
            </div>
            <h3
              className="font-serif"
              style={{ fontSize: 22, color: '#FFF9E9', marginBottom: 12, lineHeight: 1.2 }}
            >
              Modo VR para Oculus Quest
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255, 249, 233,0.7)', marginBottom: 8 }}>
              El recorrido en realidad virtual requiere un visor <strong style={{ color: '#FFF9E9' }}>Oculus / Meta Quest</strong>.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255, 249, 233,0.7)', marginBottom: 28 }}>
              Abre esta página desde el navegador de tus gafas Quest y vuelve a presionar
              «Realidad Virtual» para entrar al modo inmersivo.
            </p>
            <button
              onClick={() => setShowVrWarning(false)}
              className="uppercase tracking-widest transition-all duration-150"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#FFF9E9',
                background: '#8E6849',
                border: 'none',
                borderRadius: 10,
                padding: '12px 32px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#A07A57'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8E6849'; }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
