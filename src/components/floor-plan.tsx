'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { useTourStore } from '@/lib/tour-store';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FloorPlanRoomConfig } from '@/lib/tour-types';

// Sentido de giro del cono respecto al viewerYaw de pannellum.
// Si al girar la cámara el radar gira al revés (espejado), cambiar a -1.
const RADAR_YAW_SIGN = 1;

export default function FloorPlan() {
  const config = useTourStore((s) => s.config);
  const selectedApartment = useTourStore((s) => s.selectedApartment);
  const currentSceneId = useTourStore((s) => s.currentSceneId);
  const viewerYaw = useTourStore((s) => s.viewerYaw);
  const showFloorPlan = useTourStore((s) => s.showFloorPlan);
  const toggleFloorPlan = useTourStore((s) => s.toggleFloorPlan);
  const setCurrentScene = useTourStore((s) => s.setCurrentScene);
  const selectedVariants = useTourStore((s) => s.selectedVariants);
  const setSceneVariant = useTourStore((s) => s.setSceneVariant);

  const floorPlan = selectedApartment?.floorPlan;
  const rooms: FloorPlanRoomConfig[] = floorPlan?.rooms ?? [];
  const scenes = selectedApartment?.scenes ?? [];

  // Variante "por defecto" (amueblada) de una escena, si tiene variantes.
  const defaultVariantId = (sceneId: string) =>
    scenes.find((s) => s.id === sceneId)?.variants?.[0]?.id;

  // Una room del plano es la "actual" si coincide la escena Y la variante activa.
  // Las rooms sin variantId representan la vista amueblada/por defecto; las que
  // tienen variantId (p. ej. 'obra-gris') solo se marcan al ver esa variante.
  const isRoomCurrent = (room: FloorPlanRoomConfig) => {
    if (room.sceneId !== currentSceneId) return false;
    const def = defaultVariantId(room.sceneId);
    const active = selectedVariants[room.sceneId] ?? def;
    const roomVar = room.variantId ?? def;
    return roomVar === active;
  };

  // Room (burbuja) activa actual — la que coincide en escena y variante.
  const currentRoom = rooms.find(isRoomCurrent);

  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  /* ── Modo debug (?debug=1): permite arrastrar burbujas para recalibrar ── */
  const debugEnabled = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  // Overrides en memoria por sceneId — no se persiste, solo para captura
  const [debugOverrides, setDebugOverrides] = useState<Record<string, { dotX: number; dotY: number }>>({});
  const [draggingScene, setDraggingScene] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [debugCopied, setDebugCopied] = useState(false);
  // Offset de orientación del radar por escena (ajuste en vivo en ?debug=1)
  const [radarOffsets, setRadarOffsets] = useState<Record<string, number>>({});

  // Devuelve la posicion efectiva (override si existe, si no la original)
  const effectiveDot = (room: FloorPlanRoomConfig) => {
    const ov = debugOverrides[room.id];
    if (ov) return ov;
    return { dotX: room.dotX ?? 50, dotY: room.dotY ?? 50 };
  };

  // Offset efectivo del radar (override de debug si existe, si no el del config).
  // Indexado por room.id para distinguir amueblada vs obra gris (mismo sceneId).
  const effectiveOffset = (room: FloorPlanRoomConfig) =>
    radarOffsets[room.id] ?? room.radarOffset ?? 0;

  // Convierte el evento de mouse a coordenadas (%) dentro del SVG
  const eventToPct = (e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)), y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)) };
  };

  // Listeners globales mientras se arrastra
  useEffect(() => {
    if (!draggingScene) return;
    const onMove = (e: MouseEvent) => {
      const p = eventToPct(e);
      if (!p) return;
      setDebugOverrides((prev) => ({
        ...prev,
        [draggingScene]: { dotX: p.x, dotY: p.y },
      }));
    };
    const onUp = () => setDraggingScene(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingScene]);

  const debugCopyAll = useCallback(() => {
    if (!rooms.length) return;
    const lines = rooms.map((r) => {
      const ov = debugOverrides[r.id];
      const dx = ov?.dotX ?? r.dotX ?? 0;
      const dy = ov?.dotY ?? r.dotY ?? 0;
      const off = radarOffsets[r.id] ?? r.radarOffset ?? 0;
      return `  { id: '${r.id}', dotX: ${dx}, dotY: ${dy}, radarOffset: ${off} },`;
    });
    const out = '// Calibrado — pegar dotX/dotY/radarOffset en cada room\n' + lines.join('\n');
    try {
      navigator.clipboard.writeText(out);
      setDebugCopied(true);
      setTimeout(() => setDebugCopied(false), 1800);
    } catch { /* ignore */ }
  }, [debugOverrides, radarOffsets, rooms]);

  const debugReset = useCallback(() => {
    setDebugOverrides({});
    setRadarOffsets({});
  }, []);

  const primary = '#8E6849';

  const currentScene = selectedApartment?.scenes?.find((s) => s.id === currentSceneId);
  const currentSceneName = currentScene?.name ?? '';

  // Si hay backgroundImage, usamos el modo imagen real
  const hasBackgroundImage = Boolean(floorPlan?.backgroundImage);

  const handleRoomClick = useCallback(
    (room: FloorPlanRoomConfig) => {
      setCurrentScene(room.sceneId);
      // Si la escena tiene variantes, fijar la que corresponde a esta burbuja:
      // las burbujas de obra gris (variantId) abren esa variante; las normales
      // vuelven a la vista amueblada/por defecto.
      const scene = scenes.find((s) => s.id === room.sceneId);
      if (scene?.variants?.length) {
        setSceneVariant(room.sceneId, room.variantId ?? scene.variants[0].id);
      }
    },
    [setCurrentScene, setSceneVariant, scenes],
  );

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expanded) {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  // Debug (?debug=1): ajustar el offset del radar de la escena actual con [ y ]
  // (Shift = ±5°). El valor se ve en el panel debug y se incluye en "copiar todo".
  useEffect(() => {
    if (!debugEnabled || !currentRoom) return;
    const roomId = currentRoom.id;
    const baseOffset = currentRoom.radarOffset ?? 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' && e.key !== ']') return;
      e.preventDefault();
      const step = (e.shiftKey ? 5 : 1) * (e.key === ']' ? 1 : -1);
      setRadarOffsets((prev) => {
        const base = prev[roomId] ?? baseOffset;
        let v = Math.round((base + step) * 10) / 10;
        v = ((v % 360) + 360) % 360;
        if (v > 180) v -= 360;
        return { ...prev, [roomId]: v };
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [debugEnabled, currentRoom]);

  if (!showFloorPlan) return null;

  const svgWidth = expanded ? 900 : 320;
  const svgHeight = expanded ? 600 : 240;

  // Scale rooms proportionally
  const planW = floorPlan?.width ?? 900;
  const planH = floorPlan?.height ?? 600;
  const scaleX = svgWidth / planW;
  const scaleY = svgHeight / planH;

  // Build a map of sceneId -> room for adjacency lookups.
  // Las burbujas de variante (obra gris) NO son destino de conexiones: usamos
  // siempre la burbuja amueblada de cada escena.
  const roomMap = new Map<string, FloorPlanRoomConfig>();
  for (const room of rooms) {
    if (room.variantId) continue;
    roomMap.set(room.sceneId, room);
  }

  // Helper: obtener el punto de referencia del radar para una room.
  // Si hay dotX/dotY (modo imagen real), usa esas coordenadas.
  // En debug, aplica los overrides en memoria.
  const getDotPoint = (room: FloorPlanRoomConfig) => {
    if (hasBackgroundImage) {
      const ov = debugOverrides[room.id];
      const dx = ov?.dotX ?? room.dotX;
      const dy = ov?.dotY ?? room.dotY;
      if (dx !== undefined && dy !== undefined) {
        return {
          cx: (dx / 100) * svgWidth,
          cy: (dy / 100) * svgHeight,
        };
      }
    }
    return {
      cx: room.x * scaleX + (room.width * scaleX) / 2,
      cy: room.y * scaleY + (room.height * scaleY) / 2,
    };
  };

  // Collect unique connection pairs (undirected)
  const connectionPairs = new Set<string>();
  const connections: [FloorPlanRoomConfig, FloorPlanRoomConfig][] = [];

  for (const room of rooms) {
    const adjacent = room.adjacentTo ?? [];
    for (const adjId of adjacent) {
      const key = [room.sceneId, adjId].sort().join('::');
      if (!connectionPairs.has(key)) {
        connectionPairs.add(key);
        const adjRoom = roomMap.get(adjId);
        if (adjRoom) {
          connections.push([room, adjRoom]);
        }
      }
    }
  }

  // Helper: get room center (para rects, siempre basado en x/y/width/height)
  const getCenter = (room: FloorPlanRoomConfig) => ({
    cx: room.x * scaleX + (room.width * scaleX) / 2,
    cy: room.y * scaleY + (room.height * scaleY) / 2,
  });

  // Helper: clamp text inside room
  const getFontSize = (room: FloorPlanRoomConfig) => {
    const roomScaledW = room.width * scaleX;
    const roomScaledH = room.height * scaleY;
    const minDim = Math.min(roomScaledW, roomScaledH);
    return Math.max(8, Math.min(14, minDim * 0.18));
  };

  return (
    <>
      {/* Keyframe styles for radar animation */}
      <style>{`
        @keyframes fp-radar-ping {
          0%   { r: 10; opacity: 0.85; }
          100% { r: 42; opacity: 0; }
        }
        .fp-radar-ping {
          animation: fp-radar-ping 2s ease-out infinite;
        }
        .fp-radar-cone {
          transition: transform 0.12s linear;
        }
        @keyframes fp-bubble-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.75; }
        }
        .fp-bubble-pulse {
          animation: fp-bubble-pulse 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Overlay backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300"
          onClick={toggleExpand}
          aria-hidden
        />
      )}

      {/* Floor plan container */}
      <div
        className="fixed z-[9999] flex flex-col items-center justify-end overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          borderColor: 'rgba(142, 104, 73,0.2)',
          ...(expanded
            ? {
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `min(calc(100vw - 48px), 960px)`,
                height: `min(calc(100vh - 48px), 720px)`,
                padding: 20,
              }
            : isMobile
              ? {
                  top: 64,
                  right: 8,
                  width: 196,
                  height: 162,
                  padding: 8,
                }
              : {
                  bottom: 16,
                  right: 16,
                  width: 370,
                  height: 320,
                  padding: 14,
                }),
        }}
      >
        {/* Header bar */}
        <div className="flex w-full items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={expanded ? 16 : 13} className="text-[#FFF9E9]/70" />
            <span
              className="font-semibold tracking-wide text-[#FFF9E9]/80 select-none"
              style={{ fontSize: expanded ? 13 : 11 }}
            >
              Floor Plan
            </span>
            {debugEnabled && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase select-none"
                style={{
                  background: 'rgba(93,213,240,0.2)',
                  color: '#5DD5F0',
                  border: '1px solid rgba(93,213,240,0.5)',
                }}
              >
                DEBUG · drag
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Close button */}
            <button
              onClick={toggleFloorPlan}
              className="flex items-center justify-center rounded-lg p-1.5 text-white/60 transition-colors hover:bg-[rgba(142, 104, 73,0.1)] hover:text-white/90"
              aria-label="Close floor plan"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
            {/* Expand / Collapse */}
            <button
              onClick={toggleExpand}
              className="flex items-center justify-center rounded-lg p-1.5 text-white/60 transition-colors hover:bg-[rgba(142, 104, 73,0.1)] hover:text-white/90"
              aria-label={expanded ? 'Collapse floor plan' : 'Expand floor plan'}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* SVG floor plan */}
        <div className="flex-1 w-full min-h-0">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Defs: glow filter + drop shadow + clip */}
            <defs>
              <filter id="fp-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="fp-shadow" x="-80%" y="-80%" width="260%" height="260%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(0,0,0,1)" floodOpacity="1" />
              </filter>
              <clipPath id="fp-clip">
                <rect x={0} y={0} width={svgWidth} height={svgHeight} rx={8} />
              </clipPath>
            </defs>

            {/* ── MODO IMAGEN REAL ────────────────────────────────────── */}
            {hasBackgroundImage ? (
              <>
                {/* Imagen de planta como fondo del SVG */}
                <image
                  href={floorPlan!.backgroundImage}
                  x={0}
                  y={0}
                  width={svgWidth}
                  height={svgHeight}
                  preserveAspectRatio="xMidYMid meet"
                  clipPath="url(#fp-clip)"
                />

                {/* Lineas de conexion entre puntos dot */}
                {connections.map(([a, b], idx) => {
                  const aP = getDotPoint(a);
                  const bP = getDotPoint(b);
                  return (
                    <line
                      key={`conn-${idx}`}
                      x1={aP.cx}
                      y1={aP.cy}
                      x2={bP.cx}
                      y2={bP.cy}
                      stroke={primary}
                      strokeWidth={expanded ? 1.5 : 1}
                      strokeDasharray="5 4"
                      opacity={0.4}
                    />
                  );
                })}

                {/* Rooms: rect transparente como area de click + burbuja cyan en dotX/dotY */}
                {rooms.map((room) => {
                  const isCurrent = isRoomCurrent(room);
                  const dot = getDotPoint(room);
                  const rx = room.x * scaleX;
                  const ry = room.y * scaleY;
                  const rw = room.width * scaleX;
                  const rh = room.height * scaleY;

                  // Tamano burbuja: mas pequena en minimizado para no saturar
                  const bubbleR = expanded ? 20 : 6;
                  // Radar tamano (puede salirse de la habitacion)
                  const coneR = expanded ?90:50;
                  const halfRad = (45 * Math.PI) / 180;
                  const sinH = Math.sin(halfRad);
                  const cosH = Math.cos(halfRad);
                  const lx = dot.cx - coneR * sinH;
                  const ly = dot.cy - coneR * cosH;
                  const rx2 = dot.cx + coneR * sinH;
                  const ry2 = dot.cy - coneR * cosH;

                  // Tamano del label
                  const fontSize = expanded ? 12 : 8;

                  const isDragging = draggingScene === room.id;
                  return (
                    <g
                      key={room.id}
                      style={{ cursor: debugEnabled ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
                      onMouseDown={(e) => {
                        if (debugEnabled) {
                          e.stopPropagation();
                          setDraggingScene(room.id);
                        }
                      }}
                      onClick={() => {
                        // En debug, no navegamos al hacer click — el mousedown ya inicio drag
                        if (!debugEnabled) handleRoomClick(room);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ir a ${room.label}`}
                    >
                      {/* Area de click transparente (rect escalado) */}
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx={4}
                        fill="transparent"
                        stroke="transparent"
                        strokeWidth={1}
                      />

                      {/* RADAR (solo escena actual) — debajo de la burbuja */}
                      {isCurrent && (
                        <>
                          {/* Anillo de ping cyan (no rota) */}
                          <circle
                            cx={dot.cx}
                            cy={dot.cy}
                            fill="none"
                            stroke="#5DD5F0"
                            strokeWidth={expanded ? 2.5 : 2}
                            opacity={0.7}
                            className="fp-radar-ping pointer-events-none"
                          />
                          {/* Cono de vision grande (rota con el yaw) */}
                          <g
                            className="pointer-events-none fp-radar-cone"
                            transform={`rotate(${RADAR_YAW_SIGN * viewerYaw + effectiveOffset(room)}, ${dot.cx}, ${dot.cy})`}
                          >
                            <path
                              d={`M ${dot.cx} ${dot.cy} L ${lx} ${ly} A ${coneR} ${coneR} 0 0 1 ${rx2} ${ry2} Z`}
                              fill="rgba(93,213,240,0.35)"
                              stroke="#5DD5F0"
                              strokeWidth={expanded ? 2 : 1.5}
                              strokeLinejoin="round"
                              filter="url(#fp-shadow)"
                            />
                            {/* Linea direccional de refuerzo */}
                            <line
                              x1={dot.cx}
                              y1={dot.cy}
                              x2={dot.cx}
                              y2={dot.cy - coneR}
                              stroke="#FFFFFF"
                              strokeWidth={expanded ? 1.5 : 1.2}
                              opacity={0.85}
                            />
                          </g>
                        </>
                      )}

                      {/* BURBUJA — siempre visible, mas grande cuando es current */}
                      {/* Halo blanco */}
                      <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r={isCurrent ? bubbleR + 4 : bubbleR + 2}
                        fill="#FFFFFF"
                        opacity={isCurrent ? 0.95 : 0.85}
                        filter="url(#fp-shadow)"
                        className="transition-all duration-300"
                      />
                      {/* Cuerpo cyan */}
                      <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r={isCurrent ? bubbleR : bubbleR - 1}
                        fill="#5DD5F0"
                        stroke="#FFFFFF"
                        strokeWidth={isCurrent ? 2 : 1.5}
                        className={isCurrent ? '' : 'fp-bubble-pulse transition-all duration-300'}
                      />
                      {/* Brillo interno (highlight) */}
                      <circle
                        cx={dot.cx - bubbleR * 0.35}
                        cy={dot.cy - bubbleR * 0.35}
                        r={bubbleR * 0.35}
                        fill="rgba(255,255,255,0.55)"
                        className="pointer-events-none"
                      />
                      {/* Punto central (solo en current) */}
                      {isCurrent && (
                        <circle
                          cx={dot.cx}
                          cy={dot.cy}
                          r={expanded ? 4 : 2.5}
                          fill="#FFFFFF"
                          className="pointer-events-none"
                        />
                      )}

                      {/* Label */}
                      <text
                        x={dot.cx}
                        y={dot.cy + bubbleR + fontSize + 4}
                        textAnchor="middle"
                        dominantBaseline="auto"
                        fill={isCurrent ? '#FFFFFF' : 'rgba(255,255,255,0.9)'}
                        fontSize={fontSize}
                        fontWeight={isCurrent ? 700 : 600}
                        className="pointer-events-none select-none"
                        style={{
                          letterSpacing: 0.3,
                          paintOrder: 'stroke fill',
                        }}
                        stroke="rgba(0,0,0,0.85)"
                        strokeWidth={3}
                      >
                        {room.label}
                      </text>
                    </g>
                  );
                })}
              </>
            ) : (
              /* ── MODO CLASICO (sin imagen de fondo) ───────────────── */
              <>
                {/* Background fill */}
                {(floorPlan?.background ?? '') !== '' && (
                  <rect
                    x={0}
                    y={0}
                    width={svgWidth}
                    height={svgHeight}
                    rx={8}
                    fill={floorPlan?.background ?? 'transparent'}
                    opacity={0.4}
                  />
                )}

                {/* Connection lines (dashed) */}
                {connections.map(([a, b], idx) => {
                  const aC = getCenter(a);
                  const bC = getCenter(b);
                  return (
                    <line
                      key={`conn-${idx}`}
                      x1={aC.cx}
                      y1={aC.cy}
                      x2={bC.cx}
                      y2={bC.cy}
                      stroke={primary}
                      strokeWidth={expanded ? 1.5 : 1}
                      strokeDasharray="6 4"
                      opacity={0.35}
                    />
                  );
                })}

                {/* Rooms (modo clasico) */}
                {rooms.map((room) => {
                  const isCurrent = isRoomCurrent(room);
                  const rx = room.x * scaleX;
                  const ry = room.y * scaleY;
                  const rw = room.width * scaleX;
                  const rh = room.height * scaleY;
                  const radius = expanded ? 8 : 5;
                  const center = getCenter(room);
                  const fontSize = getFontSize(room);

                  return (
                    <g
                      key={room.id}
                      className="cursor-pointer"
                      onClick={() => handleRoomClick(room)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Go to ${room.label}`}
                    >
                      {/* Room rectangle */}
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx={radius}
                        ry={radius}
                        fill={isCurrent ? primary : (room.fill ?? 'rgba(142, 104, 73,0.08)')}
                        stroke={isCurrent ? primary : (room.stroke ?? 'rgba(142, 104, 73,0.18)')}
                        strokeWidth={isCurrent ? 2 : 1}
                        filter={isCurrent ? 'url(#fp-glow)' : undefined}
                        className="transition-all duration-300"
                        style={{ opacity: isCurrent ? 0.9 : 0.7 }}
                      />
                      {/* Hover overlay */}
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx={radius}
                        ry={radius}
                        fill="rgba(142, 104, 73,0.06)"
                        className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      />
                      {/* Label text */}
                      <text
                        x={center.cx}
                        y={isCurrent ? ry + fontSize * 1.4 : center.cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrent ? '#8E6849' : 'rgba(142, 104, 73,0.6)'}
                        fontSize={fontSize}
                        fontWeight={isCurrent ? 700 : 500}
                        className="pointer-events-none select-none"
                        style={{ letterSpacing: 0.3 }}
                      >
                        {room.label}
                      </text>
                      {/* Radar direction indicator for current room */}
                      {isCurrent && (() => {
                        const coneR = Math.max(expanded ? 14 : 9, Math.min(rw, rh) * 0.28);
                        const halfRad = (50 * Math.PI) / 180;
                        const sinH = Math.sin(halfRad);
                        const cosH = Math.cos(halfRad);
                        const lx = center.cx - coneR * sinH;
                        const ly = center.cy - coneR * cosH;
                        const rx2 = center.cx + coneR * sinH;
                        const ry2 = center.cy - coneR * cosH;
                        return (
                          <g
                            className="pointer-events-none fp-radar-cone"
                            transform={`rotate(${RADAR_YAW_SIGN * viewerYaw + effectiveOffset(room)}, ${center.cx}, ${center.cy})`}
                          >
                            <path
                              d={`M ${center.cx} ${center.cy} L ${lx} ${ly} A ${coneR} ${coneR} 0 0 1 ${rx2} ${ry2} Z`}
                              fill="rgba(40,32,26,0.28)"
                              stroke="rgba(40,32,26,0.65)"
                              strokeWidth={expanded ? 1.2 : 1}
                              strokeLinejoin="round"
                            />
                            <circle
                              cx={center.cx}
                              cy={center.cy - coneR}
                              r={expanded ? 2.5 : 1.8}
                              fill="rgba(40,32,26,0.8)"
                            />
                            <circle
                              cx={center.cx}
                              cy={center.cy}
                              fill="none"
                              stroke="rgba(40,32,26,0.5)"
                              strokeWidth={1.2}
                              className="fp-radar-ping"
                            />
                            <circle
                              cx={center.cx}
                              cy={center.cy}
                              r={expanded ? 4 : 3}
                              fill="rgba(40,32,26,0.85)"
                            />
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>

        {/* Panel debug — solo visible en ?debug=1 y modo expandido */}
        {debugEnabled && expanded && (
          <div
            className="mt-2 w-full rounded-lg overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.75)',
              border: '1px solid rgba(93,213,240,0.35)',
              padding: '8px 10px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 11,
              color: '#FFF9E9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#5DD5F0', fontWeight: 700, letterSpacing: 1, fontSize: 10 }}>
                ARRASTRA BURBUJAS · {Object.keys(debugOverrides).length} ed · RADAR [ ] AJUSTA
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={debugReset}
                  style={{
                    padding: '3px 9px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255, 249, 233,0.8)',
                    border: '1px solid rgba(142, 104, 73,0.25)', fontFamily: 'inherit',
                  }}
                >
                  reset
                </button>
                <button
                  onClick={debugCopyAll}
                  style={{
                    padding: '3px 9px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
                    background: 'rgba(93,213,240,0.18)', color: '#5DD5F0',
                    border: '1px solid rgba(93,213,240,0.5)', fontFamily: 'inherit', fontWeight: 700,
                  }}
                >
                  {debugCopied ? '✓ copiado' : 'copiar todo'}
                </button>
              </div>
            </div>
            {currentRoom && (
              <div style={{ marginBottom: 6, color: '#5DD5F0', fontSize: 10 }}>
                <strong style={{ color: '#FFF9E9' }}>{currentSceneName}{currentRoom.variantId ? ' (obra gris)' : ''}</strong>
                {' · radarOffset '}
                <strong style={{ color: '#FFF9E9' }}>
                  {(radarOffsets[currentRoom.id] ?? currentRoom.radarOffset ?? 0)}°
                </strong>
                {' · yaw cámara '}{Math.round(viewerYaw)}{'° · ajusta con [ ]  (Shift = ±5°)'}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 4 }}>
              {rooms.map((room) => {
                const d = effectiveDot(room);
                const edited = Boolean(debugOverrides[room.id]);
                return (
                  <div
                    key={room.id}
                    style={{
                      padding: '3px 6px', borderRadius: 3, fontSize: 10,
                      background: edited ? 'rgba(93,213,240,0.12)' : 'rgba(255,255,255,0.04)',
                      border: edited ? '1px solid rgba(93,213,240,0.4)' : '1px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                    }}
                  >
                    <span style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.label}
                    </span>
                    <span style={{ color: edited ? '#5DD5F0' : 'rgba(142, 104, 73,0.65)', fontWeight: edited ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {d.dotX},{d.dotY}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Current scene name */}
        <div className="mt-2 w-full text-center">
          <span
            className="block truncate font-medium tracking-wide text-white/50 select-none"
            style={{ fontSize: expanded ? 12 : 10 }}
          >
            {currentSceneName}
          </span>
        </div>
      </div>
    </>
  );
}
