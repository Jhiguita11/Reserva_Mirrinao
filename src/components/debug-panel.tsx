'use client';

/* ─────────────────────────────────────────────────────────────────────
 *  DEBUG PANEL — herramienta integral para construir proyectos rapido
 *
 *  Activacion:  ?debug=1  en la URL
 *
 *  Funciones:
 *    • Crosshair fijo con yaw/pitch/hfov en vivo
 *    • Salto rapido entre apartamentos y escenas (no toca el sidebar)
 *    • Lista de hotspots actuales con highlight si tu mira esta cerca
 *    • "Agregar hotspot aqui"  → crea uno en RAM con yaw/pitch del crosshair
 *    • "Fijar variantButton aqui" → marca posicion del boton de variante
 *    • Validacion de conexiones (hotspots a escenas inexistentes, falta
 *      de reciprocidad A↔B, escenas huerfanas sin entrada)
 *    • Export de la escena actual como snippet TS listo para pegar
 *    • Export del floor plan completo
 *    • Atajo de teclado: D para colapsar/expandir, S para escena rapida
 *  ───────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTourStore } from '@/lib/tour-store';
import type { HotspotConfig, SceneConfig, ApartmentConfig, PlaybackAnimation } from '@/lib/tour-types';
import { panDurationMs, transitionDurationMs, PLAYBACK_HFOV } from '@/lib/playback-utils';

type PanoHandle = {
  getPitch: () => number;
  getYaw: () => number;
  getHfov: () => number;
  lookAt?: (pitch?: number, yaw?: number, hfov?: number, speed?: number) => void;
};

interface DebugPanelProps {
  /** Ref al viewer activo para leer pitch/yaw/hfov */
  viewerHandle: React.RefObject<PanoHandle | null>;
}

type Tab = 'hotspots' | 'variants' | 'plan' | 'playback' | 'export' | 'check';

interface DraftHotspot {
  id: string;
  label: string;
  pitch: number;
  yaw: number;
  type: HotspotConfig['type'];
  targetSceneId?: string;
}

export default function DebugPanel({ viewerHandle }: DebugPanelProps) {
  const debugEnabled =
    typeof window !== 'undefined' && window.location.search.includes('debug=1');

  const selectedApartment = useTourStore((s) => s.selectedApartment);
  const setApartment = useTourStore((s) => s.setApartment);
  const setApartmentAtScene = useTourStore((s) => s.setApartmentAtScene);
  const currentSceneId = useTourStore((s) => s.currentSceneId);
  const setCurrentScene = useTourStore((s) => s.setCurrentScene);
  const config = useTourStore((s) => s.config);

  const allApartments: ApartmentConfig[] = useMemo(
    () => config.buildings.flatMap((b) => b.apartments),
    [config],
  );
  const currentScene: SceneConfig | undefined = selectedApartment?.scenes.find(
    (s) => s.id === currentSceneId,
  );

  /* ── Live coords del viewer ─────────────────────────────────── */
  const [coords, setCoords] = useState<{ yaw: number; pitch: number; hfov: number } | null>(null);

  useEffect(() => {
    if (!debugEnabled) return;
    const interval = setInterval(() => {
      const v = viewerHandle.current;
      if (!v) return;
      try {
        setCoords({
          yaw: Math.round(v.getYaw() * 10) / 10,
          pitch: Math.round(v.getPitch() * 10) / 10,
          hfov: Math.round(v.getHfov() * 10) / 10,
        });
      } catch {
        /* ignore */
      }
    }, 100);
    return () => clearInterval(interval);
  }, [debugEnabled, viewerHandle]);

  /* ── State del panel ────────────────────────────────────────── */
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<Tab>('hotspots');
  const [copied, setCopied] = useState<string | null>(null);

  // Drafts en memoria — el usuario los agrega aqui, luego los exporta para pegar en config
  const [drafts, setDrafts] = useState<DraftHotspot[]>([]);
  const [draftVariantBtn, setDraftVariantBtn] = useState<{ pitch: number; yaw: number } | null>(
    null,
  );

  // Keyframes de reproducción por escena (persisten al cambiar de escena para
  // poder construir las 10 sin perder trabajo). Clave = sceneId.
  const [playbackDrafts, setPlaybackDrafts] = useState<Record<string, PlaybackAnimation[]>>({});
  const [pendingFrom, setPendingFrom] = useState<{ pitch: number; yaw: number } | null>(null);
  const previewRef = useRef(false);
  const [previewing, setPreviewing] = useState(false);

  // Reset drafts (hotspots/variante) al cambiar de escena. Los playbackDrafts NO
  // se borran (son acumulativos por escena); solo limpiamos el FROM pendiente.
  useEffect(() => {
    setDrafts([]);
    setDraftVariantBtn(null);
    setPendingFrom(null);
    previewRef.current = false;
    setPreviewing(false);
  }, [currentSceneId]);

  /* ── Atajos de teclado ─────────────────────────────────────── */
  useEffect(() => {
    if (!debugEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      // Solo si el foco no esta en un input/textarea
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [debugEnabled]);

  const copy = useCallback((text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Acciones ───────────────────────────────────────────────── */
  const addDraftHotspot = useCallback(() => {
    if (!coords) return;
    const idx = drafts.length + 1;
    setDrafts((prev) => [
      ...prev,
      {
        id: `new-hotspot-${Date.now().toString(36)}`,
        label: `Nuevo ${idx}`,
        pitch: coords.pitch,
        yaw: coords.yaw,
        type: 'scene',
        targetSceneId: '',
      },
    ]);
  }, [coords, drafts.length]);

  const updateDraft = useCallback((id: string, patch: Partial<DraftHotspot>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const setVariantBtnHere = useCallback(() => {
    if (!coords) return;
    setDraftVariantBtn({ pitch: coords.pitch, yaw: coords.yaw });
  }, [coords]);

  /* ── Playback: captura de keyframes ─────────────────────────── */
  const pbAnims = playbackDrafts[currentSceneId] ?? [];

  // Marca la posición actual del crosshair como INICIO (from) del próximo tramo.
  const markFrom = useCallback(() => {
    if (coords) setPendingFrom({ pitch: coords.pitch, yaw: coords.yaw });
  }, [coords]);

  // Agrega un tramo from→to: el from es el marcado (o, si no hay, una toma
  // estática mirando aquí). El to es la posición actual del crosshair.
  const addSegment = useCallback(() => {
    if (!coords) return;
    const to = { pitch: coords.pitch, yaw: coords.yaw };
    const from = pendingFrom ?? to;
    setPlaybackDrafts((prev) => ({
      ...prev,
      [currentSceneId]: [...(prev[currentSceneId] ?? []), { from, to }],
    }));
    setPendingFrom(null);
  }, [coords, pendingFrom, currentSceneId]);

  // Toma estática: mira hacia aquí y se mantiene (from == to).
  const addStaticHold = useCallback(() => {
    if (!coords) return;
    const p = { pitch: coords.pitch, yaw: coords.yaw };
    setPlaybackDrafts((prev) => ({
      ...prev,
      [currentSceneId]: [...(prev[currentSceneId] ?? []), { from: p, to: p }],
    }));
  }, [coords, currentSceneId]);

  // Genera el recorrido "hacia las salidas": una toma estática mirando cada
  // hotspot de la escena, ordenadas por yaw para un barrido natural. Las
  // transiciones entre tomas las hace el motor de reproducción.
  const genFromExits = useCallback(() => {
    if (!currentScene) return;
    const hs = currentScene.hotspots ?? [];
    if (!hs.length) return;
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const sorted = [...hs].sort((a, b) => a.yaw - b.yaw);
    const anims: PlaybackAnimation[] = sorted.map((h) => ({
      from: { pitch: r1(h.pitch), yaw: r1(h.yaw) },
      to: { pitch: r1(h.pitch), yaw: r1(h.yaw) },
    }));
    setPlaybackDrafts((prev) => ({ ...prev, [currentSceneId]: anims }));
  }, [currentScene, currentSceneId]);

  const removeLastSegment = useCallback(() => {
    setPlaybackDrafts((prev) => ({
      ...prev,
      [currentSceneId]: (prev[currentSceneId] ?? []).slice(0, -1),
    }));
  }, [currentSceneId]);

  const clearSceneAnims = useCallback(() => {
    setPlaybackDrafts((prev) => ({ ...prev, [currentSceneId]: [] }));
    setPendingFrom(null);
  }, [currentSceneId]);

  // Previsualiza el recorrido de la escena actual usando lookAt (sin tocar el
  // motor global). Replica la semántica: fija el from, panea al to, transiciona
  // al from del siguiente, etc.
  const previewPlayback = useCallback(async () => {
    const v = viewerHandle.current;
    const anims = playbackDrafts[currentSceneId] ?? [];
    if (!v?.lookAt || !anims.length) return;
    previewRef.current = true;
    setPreviewing(true);
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
    try {
      v.lookAt(anims[0].from.pitch, anims[0].from.yaw, PLAYBACK_HFOV, 600);
      await wait(650);
      for (let i = 0; i < anims.length; i++) {
        if (!previewRef.current) return;
        const a = anims[i];
        const panMs = panDurationMs(a);
        v.lookAt(a.to.pitch, a.to.yaw, PLAYBACK_HFOV, panMs);
        await wait(panMs);
        const next = anims[i + 1];
        if (next) {
          if (!previewRef.current) return;
          const tMs = transitionDurationMs(a.to, next.from);
          v.lookAt(next.from.pitch, next.from.yaw, PLAYBACK_HFOV, tMs);
          await wait(tMs);
        }
      }
    } finally {
      previewRef.current = false;
      setPreviewing(false);
    }
  }, [viewerHandle, playbackDrafts, currentSceneId]);

  const stopPreview = useCallback(() => {
    previewRef.current = false;
    setPreviewing(false);
  }, []);

  const exportPlaybackScene = useCallback(() => {
    const anims = playbackDrafts[currentSceneId] ?? [];
    if (!anims.length) return '// (sin tramos) — captura o genera algunos primero';
    const lines = anims
      .map(
        (a) =>
          `        { from: { pitch: ${a.from.pitch}, yaw: ${a.from.yaw} }, to: { pitch: ${a.to.pitch}, yaw: ${a.to.yaw} } },`,
      )
      .join('\n');
    return `// ${currentScene?.name ?? currentSceneId}\n      playbackAnimations: [\n${lines}\n      ],`;
  }, [playbackDrafts, currentSceneId, currentScene]);

  const exportPlaybackAll = useCallback(() => {
    const entries = Object.entries(playbackDrafts).filter(([, a]) => a.length);
    if (!entries.length) return '// (no hay animaciones capturadas en ninguna escena)';
    return entries
      .map(([sid, anims]) => {
        const name = selectedApartment?.scenes.find((s) => s.id === sid)?.name ?? sid;
        const lines = anims
          .map(
            (a) =>
              `  { from: { pitch: ${a.from.pitch}, yaw: ${a.from.yaw} }, to: { pitch: ${a.to.pitch}, yaw: ${a.to.yaw} } },`,
          )
          .join('\n');
        return `// ${name} (${sid})\nplaybackAnimations: [\n${lines}\n],`;
      })
      .join('\n\n');
  }, [playbackDrafts, selectedApartment]);

  /* ── Validacion de conexiones ──────────────────────────────── */
  const validation = useMemo(() => {
    if (!selectedApartment) return null;
    const sceneIds = new Set(selectedApartment.scenes.map((s) => s.id));
    const issues: { kind: 'broken' | 'missing-reciprocal' | 'orphan'; msg: string }[] = [];

    // Hotspots que apuntan a escenas inexistentes
    selectedApartment.scenes.forEach((s) => {
      s.hotspots.forEach((h) => {
        if (h.type === 'scene' && h.targetSceneId && !sceneIds.has(h.targetSceneId)) {
          issues.push({
            kind: 'broken',
            msg: `${s.id}: hotspot "${h.label}" apunta a escena inexistente "${h.targetSceneId}"`,
          });
        }
      });
    });

    // Reciprocidad: si A tiene hotspot a B, ¿B tiene hotspot a A?
    selectedApartment.scenes.forEach((s) => {
      s.hotspots.forEach((h) => {
        if (h.type !== 'scene' || !h.targetSceneId) return;
        const target = selectedApartment.scenes.find((x) => x.id === h.targetSceneId);
        if (!target) return;
        const reciprocal = target.hotspots.some(
          (rh) => rh.type === 'scene' && rh.targetSceneId === s.id,
        );
        if (!reciprocal) {
          issues.push({
            kind: 'missing-reciprocal',
            msg: `${s.id} → ${target.id}: falta el camino de regreso ${target.id} → ${s.id}`,
          });
        }
      });
    });

    // Escenas huerfanas: nadie llega a ellas (excepto la primera)
    const firstSceneId = selectedApartment.scenes[0]?.id;
    selectedApartment.scenes.forEach((s) => {
      if (s.id === firstSceneId) return;
      const hasInbound = selectedApartment.scenes.some((other) =>
        other.hotspots.some((h) => h.type === 'scene' && h.targetSceneId === s.id),
      );
      if (!hasInbound) {
        issues.push({ kind: 'orphan', msg: `${s.id} no tiene ningun hotspot entrante` });
      }
    });

    return { issues, byKind: { broken: 0, 'missing-reciprocal': 0, orphan: 0 } };
  }, [selectedApartment]);

  if (validation) {
    validation.issues.forEach((i) => (validation.byKind[i.kind] += 1));
  }

  /* ── Snippet exporters ─────────────────────────────────────── */
  const exportSceneSnippet = useCallback(() => {
    if (!currentScene) return '';
    const allHs: { pitch: number; yaw: number; label: string; targetSceneId?: string; type: string; id: string }[] = [
      ...currentScene.hotspots.map((h) => ({
        id: h.id, pitch: h.pitch, yaw: h.yaw, label: h.label,
        targetSceneId: h.targetSceneId, type: h.type,
      })),
      ...drafts.map((d) => ({
        id: d.id, pitch: d.pitch, yaw: d.yaw, label: d.label,
        targetSceneId: d.targetSceneId, type: d.type,
      })),
    ];
    const hsLines = allHs
      .map(
        (h) => `        {
          id: '${h.id}',
          pitch: ${h.pitch}, yaw: ${h.yaw},
          type: '${h.type}',
          label: '${h.label}',
          ${h.targetSceneId ? `targetSceneId: '${h.targetSceneId}',` : ''}
        },`,
      )
      .join('\n');
    const vb = draftVariantBtn ?? currentScene.variantButton;
    const vbLine = vb ? `      variantButton: { pitch: ${vb.pitch}, yaw: ${vb.yaw} },\n` : '';
    return `// Escena: ${currentScene.name} (${currentScene.id})
    {
      id: '${currentScene.id}',
      name: '${currentScene.name}',
      description: '${currentScene.description ?? ''}',
      panorama: PANO('${currentScene.panorama.split('/').pop()}'),
      defaultView: { pitch: ${currentScene.defaultView?.pitch ?? 0}, yaw: ${currentScene.defaultView?.yaw ?? 0}, hfov: ${currentScene.defaultView?.hfov ?? 100} },
${vbLine}      hotspots: [
${hsLines}
      ],
    },`;
  }, [currentScene, drafts, draftVariantBtn]);

  const exportFloorPlanSnippet = useCallback(() => {
    const rooms = selectedApartment?.floorPlan?.rooms ?? [];
    if (!rooms.length) return '// No hay rooms en este apartamento';
    const lines = rooms.map(
      (r) => `        {
          id: '${r.id}',
          sceneId: '${r.sceneId}',
          label: '${r.label}',
          x: ${r.x}, y: ${r.y}, width: ${r.width}, height: ${r.height},
          dotX: ${r.dotX ?? 50}, dotY: ${r.dotY ?? 50},
          adjacentTo: [${(r.adjacentTo ?? []).map((a) => `'${a}'`).join(', ')}],
        },`,
    );
    return `// Floor plan: ${selectedApartment?.name ?? ''}
floorPlan: {
  width: ${selectedApartment?.floorPlan?.width ?? 1000},
  height: ${selectedApartment?.floorPlan?.height ?? 800},
  background: '${selectedApartment?.floorPlan?.background ?? 'transparent'}',
  ${selectedApartment?.floorPlan?.backgroundImage ? `backgroundImage: '${selectedApartment.floorPlan.backgroundImage}',` : ''}
  rooms: [
${lines.join('\n')}
  ],
},`;
  }, [selectedApartment]);

  if (!debugEnabled) return null;
  if (!coords) return null;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <>
      {/* Crosshair central */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 199,
          pointerEvents: 'none',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid #5DD5F0',
            borderRadius: '50%',
            boxShadow:
              '0 0 12px rgba(93,213,240,0.6), inset 0 0 8px rgba(93,213,240,0.3)',
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 36,
            height: 36,
            border: '1px solid rgba(93,213,240,0.6)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 80,
            height: 1,
            background:
              'linear-gradient(to right, transparent 0%, rgba(93,213,240,0.9) 30%, rgba(93,213,240,0.9) 70%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 1,
            height: 80,
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(93,213,240,0.9) 30%, rgba(93,213,240,0.9) 70%, transparent 100%)',
          }}
        />
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 6px #5DD5F0, 0 0 2px #FFF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(93,213,240,0.5)',
            borderRadius: 6,
            padding: '4px 10px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 12,
            color: '#5DD5F0',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ opacity: 0.6 }}>yaw </span>
          <b style={{ color: '#FFF' }}>{coords.yaw}</b>
          <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>
          <span style={{ opacity: 0.6 }}>pitch </span>
          <b style={{ color: '#FFF' }}>{coords.pitch}</b>
        </div>
      </div>

      {/* PANEL principal */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 12,
          zIndex: 200,
          background: 'rgba(0,0,0,0.9)',
          border: '1px solid rgba(142, 104, 73,0.35)',
          borderRadius: 10,
          minWidth: collapsed ? 200 : 360,
          maxWidth: 420,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 12,
          color: '#FFF9E9',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header con escena selector + collapse */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            borderBottom: collapsed ? 'none' : '1px solid rgba(142, 104, 73,0.18)',
          }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            title="Colapsar / expandir (tecla D)"
            style={{
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(93,213,240,0.18)',
              border: '1px solid rgba(93,213,240,0.5)',
              borderRadius: 4,
              color: '#5DD5F0',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {collapsed ? '▶' : '▼'} DEBUG
          </button>

          {!collapsed && (
            <>
              {/* Apartamento selector */}
              <select
                value={selectedApartment?.id ?? ''}
                onChange={(e) => {
                  const apt = allApartments.find((a) => a.id === e.target.value);
                  if (apt) setApartmentAtScene(apt, apt.scenes[0]?.id ?? '');
                }}
                title="Saltar a otro apartamento"
                style={{
                  flex: 0,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#FFF9E9',
                  border: '1px solid rgba(142, 104, 73,0.25)',
                  borderRadius: 4,
                  padding: '3px 4px',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {allApartments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              {/* Escena selector */}
              <select
                value={currentSceneId}
                onChange={(e) => setCurrentScene(e.target.value)}
                title="Saltar a otra escena"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#FFF9E9',
                  border: '1px solid rgba(142, 104, 73,0.25)',
                  borderRadius: 4,
                  padding: '3px 4px',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {(selectedApartment?.scenes ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(142, 104, 73,0.18)',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              {[
                { id: 'hotspots' as Tab, label: 'Hotspots', count: (currentScene?.hotspots.length ?? 0) + drafts.length },
                { id: 'variants' as Tab, label: 'Variante', count: currentScene?.variants?.length ?? 0 },
                { id: 'plan' as Tab, label: 'Floor', count: selectedApartment?.floorPlan?.rooms?.length ?? 0 },
                { id: 'playback' as Tab, label: 'Playback', count: pbAnims.length },
                { id: 'export' as Tab, label: 'Export' },
                { id: 'check' as Tab, label: 'Check', count: validation?.issues.length ?? 0 },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: 10,
                    fontWeight: tab === t.id ? 700 : 500,
                    border: 'none',
                    background: tab === t.id ? 'rgba(142, 104, 73,0.1)' : 'transparent',
                    color: tab === t.id ? '#8E6849' : 'rgba(142, 104, 73,0.55)',
                    cursor: 'pointer',
                    borderBottom: tab === t.id ? '2px solid #5DD5F0' : '2px solid transparent',
                    fontFamily: 'inherit',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 9 }}>({t.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Live coords resumen */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderBottom: '1px solid rgba(142, 104, 73,0.18)',
                background: 'rgba(93,213,240,0.04)',
              }}
            >
              <div style={{ fontSize: 11 }}>
                <span style={{ opacity: 0.55 }}>yaw </span>
                <b style={{ fontSize: 13 }}>{coords.yaw}</b>
                <span style={{ opacity: 0.3, margin: '0 6px' }}>·</span>
                <span style={{ opacity: 0.55 }}>pitch </span>
                <b style={{ fontSize: 13 }}>{coords.pitch}</b>
                <span style={{ opacity: 0.3, margin: '0 6px' }}>·</span>
                <span style={{ opacity: 0.55 }}>hfov </span>
                <span style={{ opacity: 0.85 }}>{coords.hfov}</span>
              </div>
              <button
                onClick={() => copy(`pitch: ${coords.pitch}, yaw: ${coords.yaw}`, 'pair')}
                title="Copiar pitch/yaw del crosshair"
                style={{
                  padding: '3px 9px',
                  fontSize: 10,
                  background: 'rgba(93,213,240,0.18)',
                  border: '1px solid rgba(93,213,240,0.5)',
                  borderRadius: 4,
                  color: '#5DD5F0',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                }}
              >
                {copied === 'pair' ? '✓' : 'copy p/y'}
              </button>
            </div>

            {/* Tab content */}
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 10px' }}>
              {tab === 'hotspots' && (
                <>
                  {/* Boton agregar */}
                  <button
                    onClick={addDraftHotspot}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: 11,
                      background: 'rgba(93,213,240,0.15)',
                      border: '1px dashed rgba(93,213,240,0.5)',
                      borderRadius: 5,
                      color: '#5DD5F0',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    + Agregar hotspot en el crosshair
                  </button>

                  {/* Drafts en memoria */}
                  {drafts.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontSize: 9,
                          opacity: 0.55,
                          letterSpacing: 1,
                          marginBottom: 4,
                        }}
                      >
                        NUEVOS DRAFTS ({drafts.length})
                      </div>
                      {drafts.map((d) => (
                        <div
                          key={d.id}
                          style={{
                            background: 'rgba(93,213,240,0.08)',
                            border: '1px solid rgba(93,213,240,0.3)',
                            borderRadius: 4,
                            padding: 6,
                            marginBottom: 4,
                            fontSize: 10,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                            <input
                              value={d.label}
                              onChange={(e) => updateDraft(d.id, { label: e.target.value })}
                              placeholder="Label"
                              style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(142, 104, 73,0.2)',
                                borderRadius: 3,
                                color: '#FFF9E9',
                                padding: '2px 5px',
                                fontSize: 10,
                                fontFamily: 'inherit',
                              }}
                            />
                            <button
                              onClick={() => removeDraft(d.id)}
                              title="Eliminar draft"
                              style={{
                                background: 'rgba(255,80,80,0.15)',
                                border: '1px solid rgba(255,80,80,0.4)',
                                borderRadius: 3,
                                color: '#FF8888',
                                padding: '2px 6px',
                                fontSize: 10,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <select
                            value={d.targetSceneId ?? ''}
                            onChange={(e) =>
                              updateDraft(d.id, { targetSceneId: e.target.value })
                            }
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(142, 104, 73,0.2)',
                              borderRadius: 3,
                              color: '#FFF9E9',
                              padding: '2px 5px',
                              fontSize: 10,
                              fontFamily: 'inherit',
                              marginBottom: 3,
                            }}
                          >
                            <option value="">-- target scene --</option>
                            {(selectedApartment?.scenes ?? []).map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                            <span>pitch: {d.pitch}</span>
                            <span>yaw: {d.yaw}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hotspots existentes */}
                  {currentScene?.hotspots && currentScene.hotspots.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 9,
                          opacity: 0.55,
                          letterSpacing: 1,
                          marginBottom: 4,
                        }}
                      >
                        EN CONFIG ({currentScene.hotspots.length})
                      </div>
                      {currentScene.hotspots.map((h) => {
                        const dYaw = Math.round((coords.yaw - (h.yaw ?? 0)) * 10) / 10;
                        const aligned = Math.abs(dYaw) < 3;
                        return (
                          <div
                            key={h.id}
                            style={{
                              background: aligned
                                ? 'rgba(93,213,240,0.12)'
                                : 'rgba(255,255,255,0.04)',
                              border: aligned
                                ? '1px solid rgba(93,213,240,0.4)'
                                : '1px solid transparent',
                              borderRadius: 4,
                              padding: '5px 7px',
                              marginBottom: 3,
                              fontSize: 10,
                              display: 'grid',
                              gridTemplateColumns: '1fr auto auto auto',
                              gap: 6,
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                              }}
                            >
                              {h.label}
                            </span>
                            <span style={{ opacity: 0.7, fontSize: 9 }}>
                              p:{h.pitch} y:{h.yaw}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                color: aligned ? '#5DD5F0' : 'rgba(142, 104, 73,0.45)',
                                minWidth: 32,
                                textAlign: 'right',
                              }}
                            >
                              Δ{dYaw > 0 ? '+' : ''}{dYaw}
                            </span>
                            <button
                              onClick={() => {
                                if (viewerHandle.current?.lookAt) {
                                  try { viewerHandle.current.lookAt(h.pitch, h.yaw, 100); } catch {}
                                }
                              }}
                              title="Apuntar la camara al hotspot"
                              style={{
                                background: 'rgba(142, 104, 73,0.1)',
                                border: '1px solid rgba(142, 104, 73,0.25)',
                                borderRadius: 3,
                                color: '#FFF9E9',
                                padding: '1px 6px',
                                fontSize: 9,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              go
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              {tab === 'variants' && (
                <>
                  {currentScene?.variants && currentScene.variants.length > 0 ? (
                    <>
                      <div
                        style={{
                          fontSize: 9,
                          opacity: 0.55,
                          letterSpacing: 1,
                          marginBottom: 6,
                        }}
                      >
                        VARIANTES ({currentScene.variants.length})
                      </div>
                      {currentScene.variants.map((v) => (
                        <div
                          key={v.id}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: 4,
                            padding: '5px 7px',
                            marginBottom: 3,
                            fontSize: 10,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{v.label}</div>
                          <div style={{ opacity: 0.6, fontSize: 9 }}>
                            {v.linkSceneId ? `→ link a ${v.linkSceneId}` : v.panorama?.split('/').pop()}
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: '1px solid rgba(142, 104, 73,0.18)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            opacity: 0.55,
                            letterSpacing: 1,
                            marginBottom: 4,
                          }}
                        >
                          BOTON DE VARIANTE
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: 4,
                            padding: '5px 7px',
                            marginBottom: 6,
                            fontSize: 10,
                            opacity: 0.85,
                          }}
                        >
                          actual:{' '}
                          {currentScene.variantButton
                            ? `p:${currentScene.variantButton.pitch}, y:${currentScene.variantButton.yaw}`
                            : '(no fijado)'}
                        </div>
                        {draftVariantBtn && (
                          <div
                            style={{
                              background: 'rgba(93,213,240,0.12)',
                              border: '1px solid rgba(93,213,240,0.4)',
                              borderRadius: 4,
                              padding: '5px 7px',
                              marginBottom: 6,
                              fontSize: 10,
                            }}
                          >
                            <b style={{ color: '#5DD5F0' }}>draft:</b> p:{draftVariantBtn.pitch}, y:
                            {draftVariantBtn.yaw}
                          </div>
                        )}
                        <button
                          onClick={setVariantBtnHere}
                          style={{
                            width: '100%',
                            padding: '5px 10px',
                            fontSize: 10,
                            background: 'rgba(93,213,240,0.15)',
                            border: '1px dashed rgba(93,213,240,0.5)',
                            borderRadius: 4,
                            color: '#5DD5F0',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: 700,
                          }}
                        >
                          + Fijar boton de variante en el crosshair
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ opacity: 0.55, fontSize: 11, padding: 8 }}>
                      Esta escena no tiene variantes definidas.
                    </div>
                  )}
                </>
              )}

              {tab === 'plan' && (
                <>
                  <div
                    style={{
                      fontSize: 9,
                      opacity: 0.55,
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    FLOOR PLAN — {selectedApartment?.floorPlan?.rooms?.length ?? 0} ROOMS
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.7,
                      padding: 6,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 4,
                      marginBottom: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    Para mover las burbujas, abre el Floor Plan (icono mapa en la sidebar) y
                    expandelo. Veras el modo arrastre activo. El boton{' '}
                    <b style={{ color: '#5DD5F0' }}>copiar todo</b> trae el snippet ya hecho.
                  </div>
                  {(selectedApartment?.floorPlan?.rooms ?? []).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: r.sceneId === currentSceneId
                          ? 'rgba(93,213,240,0.12)'
                          : 'rgba(255,255,255,0.04)',
                        border: r.sceneId === currentSceneId
                          ? '1px solid rgba(93,213,240,0.4)'
                          : '1px solid transparent',
                        borderRadius: 4,
                        padding: '5px 7px',
                        marginBottom: 3,
                        fontSize: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{r.label}</span>
                      <span style={{ opacity: 0.7, fontSize: 9 }}>
                        dx:{r.dotX} dy:{r.dotY}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {tab === 'playback' && (
                <>
                  <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.5, marginBottom: 8 }}>
                    Recorrido <b style={{ color: '#5DD5F0' }}>hacia las salidas</b>. Apunta la cámara
                    (arrastra) y captura tramos, o genera uno automático desde los hotspots. El motor
                    panea <i>from→to</i> y transiciona al siguiente.
                  </div>

                  {/* Autogenerar + toma estática */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    <button
                      onClick={genFromExits}
                      title="Crea una toma por cada salida (hotspot), ordenadas por yaw"
                      style={{
                        flex: 1, padding: '6px 8px', fontSize: 10, fontWeight: 700,
                        background: 'rgba(93,213,240,0.18)', border: '1px solid rgba(93,213,240,0.5)',
                        borderRadius: 5, color: '#5DD5F0', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      ⚡ Generar desde salidas
                    </button>
                    <button
                      onClick={addStaticHold}
                      title="Agrega una toma estática mirando hacia el crosshair"
                      style={{
                        padding: '6px 8px', fontSize: 10, fontWeight: 700,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(142, 104, 73,0.3)',
                        borderRadius: 5, color: '#FFF9E9', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      + estática
                    </button>
                  </div>

                  {/* Captura from → to */}
                  <div
                    style={{
                      display: 'flex', gap: 4, marginBottom: 6, padding: 6,
                      background: 'rgba(255,255,255,0.03)', borderRadius: 5,
                      border: '1px solid rgba(142, 104, 73,0.18)',
                    }}
                  >
                    <button
                      onClick={markFrom}
                      title="Marca la vista actual como inicio del tramo"
                      style={{
                        flex: 1, padding: '6px 8px', fontSize: 10, fontWeight: 700,
                        background: pendingFrom ? 'rgba(93,213,240,0.28)' : 'rgba(93,213,240,0.12)',
                        border: '1px dashed rgba(93,213,240,0.5)', borderRadius: 4,
                        color: '#5DD5F0', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {pendingFrom ? `FROM ✓ (y:${pendingFrom.yaw})` : '① Marcar inicio'}
                    </button>
                    <button
                      onClick={addSegment}
                      title="Agrega el tramo desde el inicio marcado hasta la vista actual"
                      style={{
                        flex: 1, padding: '6px 8px', fontSize: 10, fontWeight: 700,
                        background: 'rgba(93,213,240,0.12)', border: '1px dashed rgba(93,213,240,0.5)',
                        borderRadius: 4, color: '#5DD5F0', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      ② Agregar tramo → aquí
                    </button>
                  </div>

                  {/* Preview / stop */}
                  <button
                    onClick={previewing ? stopPreview : previewPlayback}
                    disabled={!pbAnims.length}
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: 11, fontWeight: 700,
                      background: previewing ? 'rgba(255,120,120,0.18)' : 'rgba(80,200,120,0.18)',
                      border: previewing ? '1px solid rgba(255,120,120,0.5)' : '1px solid rgba(80,200,120,0.5)',
                      borderRadius: 5, color: previewing ? '#FF9090' : '#80E090',
                      cursor: pbAnims.length ? 'pointer' : 'not-allowed', opacity: pbAnims.length ? 1 : 0.4,
                      fontFamily: 'inherit', marginBottom: 8,
                    }}
                  >
                    {previewing ? '■ Detener preview' : '▶ Previsualizar recorrido'}
                  </button>

                  {/* Lista de tramos */}
                  {pbAnims.length > 0 ? (
                    <>
                      <div style={{ fontSize: 9, opacity: 0.55, letterSpacing: 1, marginBottom: 4 }}>
                        TRAMOS ({pbAnims.length})
                      </div>
                      {pbAnims.map((a, i) => {
                        const isStatic =
                          Math.abs(a.from.yaw - a.to.yaw) < 1 && Math.abs(a.from.pitch - a.to.pitch) < 1;
                        return (
                          <div
                            key={i}
                            style={{
                              background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '4px 7px',
                              marginBottom: 3, fontSize: 10, display: 'flex', gap: 6,
                              alignItems: 'center', justifyContent: 'space-between',
                            }}
                          >
                            <span style={{ opacity: 0.5, minWidth: 16 }}>{i + 1}</span>
                            <span style={{ flex: 1, fontSize: 9 }}>
                              {isStatic ? (
                                <>mira <b>y:{a.to.yaw}</b> p:{a.to.pitch}</>
                              ) : (
                                <>y:{a.from.yaw}→<b>{a.to.yaw}</b> · p:{a.from.pitch}→{a.to.pitch}</>
                              )}
                            </span>
                            <button
                              onClick={() => { try { viewerHandle.current?.lookAt?.(a.from.pitch, a.from.yaw, PLAYBACK_HFOV, 400); } catch {} }}
                              title="Apuntar al inicio de este tramo"
                              style={{
                                background: 'rgba(142, 104, 73,0.12)', border: '1px solid rgba(142, 104, 73,0.25)',
                                borderRadius: 3, color: '#FFF9E9', padding: '1px 6px', fontSize: 9,
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              go
                            </button>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        <button
                          onClick={removeLastSegment}
                          style={{
                            flex: 1, padding: '5px 8px', fontSize: 10, background: 'rgba(255,180,80,0.12)',
                            border: '1px solid rgba(255,180,80,0.4)', borderRadius: 4, color: '#FFC080',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          ↶ Quitar último
                        </button>
                        <button
                          onClick={clearSceneAnims}
                          style={{
                            flex: 1, padding: '5px 8px', fontSize: 10, background: 'rgba(255,80,80,0.12)',
                            border: '1px solid rgba(255,80,80,0.4)', borderRadius: 4, color: '#FF8888',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          × Limpiar escena
                        </button>
                      </div>

                      {/* Export */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <button
                          onClick={() => copy(exportPlaybackScene(), 'pb-scene')}
                          style={{
                            flex: 1, padding: '6px 8px', fontSize: 10, fontWeight: 700,
                            background: 'rgba(93,213,240,0.18)', border: '1px solid rgba(93,213,240,0.5)',
                            borderRadius: 4, color: '#5DD5F0', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {copied === 'pb-scene' ? '✓ copiado' : 'Copiar esta escena'}
                        </button>
                        <button
                          onClick={() => copy(exportPlaybackAll(), 'pb-all')}
                          title="Exporta las animaciones de todas las escenas capturadas"
                          style={{
                            flex: 1, padding: '6px 8px', fontSize: 10, fontWeight: 700,
                            background: 'rgba(93,213,240,0.1)', border: '1px solid rgba(93,213,240,0.35)',
                            borderRadius: 4, color: '#5DD5F0', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {copied === 'pb-all' ? '✓ copiado' : 'Copiar TODAS'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ opacity: 0.55, fontSize: 11, padding: 8, textAlign: 'center' }}>
                      Sin tramos aún. Usa <b style={{ color: '#5DD5F0' }}>⚡ Generar desde salidas</b> o
                      captura con ① / ②.
                    </div>
                  )}
                </>
              )}

              {tab === 'export' && (
                <>
                  <button
                    onClick={() => copy(exportSceneSnippet(), 'export-scene')}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: 11,
                      background: 'rgba(93,213,240,0.18)',
                      border: '1px solid rgba(93,213,240,0.5)',
                      borderRadius: 5,
                      color: '#5DD5F0',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      marginBottom: 6,
                      textAlign: 'left',
                    }}
                  >
                    {copied === 'export-scene'
                      ? '✓ Escena copiada (drafts + variantButton incluidos)'
                      : 'Exportar escena actual completa'}
                  </button>
                  <button
                    onClick={() => copy(exportFloorPlanSnippet(), 'export-plan')}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: 11,
                      background: 'rgba(93,213,240,0.18)',
                      border: '1px solid rgba(93,213,240,0.5)',
                      borderRadius: 5,
                      color: '#5DD5F0',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      marginBottom: 6,
                      textAlign: 'left',
                    }}
                  >
                    {copied === 'export-plan' ? '✓ Floor plan copiado' : 'Exportar floor plan completo'}
                  </button>
                  <div
                    style={{
                      fontSize: 9,
                      opacity: 0.5,
                      lineHeight: 1.5,
                      padding: 6,
                      marginTop: 4,
                    }}
                  >
                    Los snippets vienen en formato TS listo para pegar en{' '}
                    <code style={{ color: '#5DD5F0' }}>tour.config.ts</code>. Ajusta el helper{' '}
                    <code>PANO()</code> al de tu proyecto y los <code>defaultView</code> manualmente
                    si quieres una vista inicial concreta.
                  </div>
                </>
              )}

              {tab === 'check' && (
                <>
                  {validation && validation.issues.length === 0 ? (
                    <div
                      style={{
                        padding: 8,
                        background: 'rgba(80,200,120,0.12)',
                        border: '1px solid rgba(80,200,120,0.4)',
                        borderRadius: 4,
                        color: '#80E090',
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                    >
                      ✓ Sin problemas detectados en este apartamento
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6, fontSize: 9 }}>
                        <span
                          style={{
                            background: 'rgba(255,80,80,0.15)',
                            color: '#FF8888',
                            padding: '2px 6px',
                            borderRadius: 3,
                          }}
                        >
                          rotos: {validation?.byKind.broken ?? 0}
                        </span>
                        <span
                          style={{
                            background: 'rgba(255,180,80,0.15)',
                            color: '#FFC080',
                            padding: '2px 6px',
                            borderRadius: 3,
                          }}
                        >
                          sin vuelta: {validation?.byKind['missing-reciprocal'] ?? 0}
                        </span>
                        <span
                          style={{
                            background: 'rgba(180,180,180,0.15)',
                            color: '#CCCCCC',
                            padding: '2px 6px',
                            borderRadius: 3,
                          }}
                        >
                          huerfanas: {validation?.byKind.orphan ?? 0}
                        </span>
                      </div>
                      {validation?.issues.map((i, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: 9,
                            padding: '4px 6px',
                            marginBottom: 3,
                            background:
                              i.kind === 'broken'
                                ? 'rgba(255,80,80,0.08)'
                                : i.kind === 'missing-reciprocal'
                                  ? 'rgba(255,180,80,0.08)'
                                  : 'rgba(180,180,180,0.08)',
                            borderLeft:
                              i.kind === 'broken'
                                ? '2px solid #FF8888'
                                : i.kind === 'missing-reciprocal'
                                  ? '2px solid #FFC080'
                                  : '2px solid #888',
                            borderRadius: 3,
                            color: '#FFF9E9',
                            lineHeight: 1.4,
                          }}
                        >
                          {i.msg}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Hint footer */}
            <div
              style={{
                fontSize: 9,
                opacity: 0.4,
                padding: '4px 10px 8px',
                borderTop: '1px solid rgba(142, 104, 73,0.1)',
                lineHeight: 1.4,
              }}
            >
              <kbd
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  padding: '0 4px',
                  borderRadius: 2,
                }}
              >
                D
              </kbd>{' '}
              colapsa · arrastra la escena para apuntar · usa los dropdowns para saltar
            </div>
          </>
        )}
      </div>
    </>
  );
}
