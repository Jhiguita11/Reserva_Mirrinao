'use client';

/* ─────────────────────────────────────────────────────────────────────
 *  DEBUG PANEL — herramienta integral para construir proyectos rápido
 *
 *  Activación:  ?debug=1  en la URL
 *
 *  Diseño: panel flotante con SECCIONES DESPLEGABLES (acordeón). Arriba,
 *  siempre visibles: salto de apartamento/escena y las coordenadas en vivo
 *  del crosshair. Debajo, cada herramienta en su propia sección colapsable:
 *    • 📍 Hotspots   — listar/añadir hotspots, "go" para apuntar
 *    • 🎚️ Variantes  — ver variantes y fijar el botón de variante
 *    • 🎬 Reproducción — autorar playbackAnimations (velocidad, captura, preview)
 *    • 🗺️ Floor plan — listar rooms del plano
 *    • 📤 Exportar   — snippets TS de la escena / floor plan
 *    • ✅ Validación  — hotspots rotos, sin reciprocidad, escenas huérfanas
 *
 *  Atajos: D colapsa/expande todo el panel.
 *  ───────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTourStore } from '@/lib/tour-store';
import type { HotspotConfig, SceneConfig, ApartmentConfig, PlaybackAnimation } from '@/lib/tour-types';
import {
  panDurationMs,
  transitionDurationMs,
  PLAYBACK_HFOV,
  PAN_SPEED,
  TRANSITION_SPEED,
  STATIC_HOLD_MS,
} from '@/lib/playback-utils';

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

interface DraftHotspot {
  id: string;
  label: string;
  pitch: number;
  yaw: number;
  type: HotspotConfig['type'];
  targetSceneId?: string;
}

/* ── Tokens de estilo compartidos ──────────────────────────────────── */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const CYAN = '#5DD5F0';
const CREAM = '#FFF9E9';
const CARAMEL = '#8E6849';

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(142,104,73,0.25)',
  borderRadius: 4,
  color: CREAM,
  padding: '3px 6px',
  fontSize: 10,
  fontFamily: MONO,
};

type BtnTone = 'cyan' | 'ghost' | 'green' | 'warn' | 'danger';
function btn(tone: BtnTone, extra?: React.CSSProperties): React.CSSProperties {
  const tones: Record<BtnTone, { bg: string; bd: string; fg: string }> = {
    cyan: { bg: 'rgba(93,213,240,0.16)', bd: 'rgba(93,213,240,0.5)', fg: CYAN },
    ghost: { bg: 'rgba(255,255,255,0.05)', bd: 'rgba(142,104,73,0.3)', fg: CREAM },
    green: { bg: 'rgba(80,200,120,0.16)', bd: 'rgba(80,200,120,0.5)', fg: '#80E090' },
    warn: { bg: 'rgba(255,180,80,0.14)', bd: 'rgba(255,180,80,0.45)', fg: '#FFC080' },
    danger: { bg: 'rgba(255,80,80,0.14)', bd: 'rgba(255,80,80,0.45)', fg: '#FF8888' },
  };
  const t = tones[tone];
  return {
    padding: '6px 9px',
    fontSize: 10,
    fontWeight: 700,
    background: t.bg,
    border: `1px solid ${t.bd}`,
    borderRadius: 5,
    color: t.fg,
    cursor: 'pointer',
    fontFamily: MONO,
    ...extra,
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  opacity: 0.5,
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom: 5,
};

/* ── Sección desplegable (acordeón) ───────────────────────────────── */
function Section({
  icon,
  title,
  badge,
  badgeTone = 'cyan',
  open,
  onToggle,
  hint,
  children,
}: {
  icon: string;
  title: string;
  badge?: number | string;
  badgeTone?: 'cyan' | 'green' | 'red';
  open: boolean;
  onToggle: () => void;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  const badgeColors = {
    cyan: { bg: 'rgba(93,213,240,0.18)', fg: CYAN },
    green: { bg: 'rgba(80,200,120,0.2)', fg: '#80E090' },
    red: { bg: 'rgba(255,80,80,0.2)', fg: '#FF8888' },
  }[badgeTone];
  return (
    <div style={{ borderTop: '1px solid rgba(142,104,73,0.14)' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          padding: '9px 11px',
          background: open ? 'rgba(93,213,240,0.06)' : 'transparent',
          border: 'none',
          color: CREAM,
          cursor: 'pointer',
          fontFamily: MONO,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 10,
            fontSize: 9,
            color: CYAN,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          ▶
        </span>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {title}
        </span>
        {badge !== undefined && badge !== '' && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              minWidth: 18,
              textAlign: 'center',
              padding: '1px 6px',
              borderRadius: 10,
              background: badgeColors.bg,
              color: badgeColors.fg,
            }}
          >
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: '0 11px 12px' }}>
          {hint && (
            <div style={{ fontSize: 9.5, opacity: 0.55, lineHeight: 1.55, marginBottom: 9 }}>{hint}</div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default function DebugPanel({ viewerHandle }: DebugPanelProps) {
  const debugEnabled =
    typeof window !== 'undefined' && window.location.search.includes('debug=1');

  const selectedApartment = useTourStore((s) => s.selectedApartment);
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
  const sceneList = selectedApartment?.scenes ?? [];
  const sceneIdx = sceneList.findIndex((s) => s.id === currentSceneId);

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
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(['hotspots']));
  const [copied, setCopied] = useState<string | null>(null);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const ALL_SECTIONS = ['hotspots', 'variants', 'playback', 'plan', 'export', 'check'];

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

  // Ajustes de velocidad/HFOV del modo reproducción (afectan la preview y se
  // exportan como bloque `playback` para pegar en tour.config.ts).
  const [pbSettings, setPbSettings] = useState(() => ({
    panSpeed: config.playback?.panSpeed ?? PAN_SPEED,
    transitionSpeed: config.playback?.transitionSpeed ?? TRANSITION_SPEED,
    staticHoldMs: config.playback?.staticHoldMs ?? STATIC_HOLD_MS,
    hfov: config.playback?.hfov ?? PLAYBACK_HFOV,
  }));

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

  const goScene = useCallback(
    (delta: number) => {
      if (!sceneList.length) return;
      const n = (sceneIdx + delta + sceneList.length) % sceneList.length;
      setCurrentScene(sceneList[n].id);
    },
    [sceneList, sceneIdx, setCurrentScene],
  );

  /* ── Acciones hotspots ──────────────────────────────────────── */
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

  const markFrom = useCallback(() => {
    if (coords) setPendingFrom({ pitch: coords.pitch, yaw: coords.yaw });
  }, [coords]);

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

  const addStaticHold = useCallback(() => {
    if (!coords) return;
    const p = { pitch: coords.pitch, yaw: coords.yaw };
    setPlaybackDrafts((prev) => ({
      ...prev,
      [currentSceneId]: [...(prev[currentSceneId] ?? []), { from: p, to: p }],
    }));
  }, [coords, currentSceneId]);

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

  const previewPlayback = useCallback(async () => {
    const v = viewerHandle.current;
    const anims = playbackDrafts[currentSceneId] ?? [];
    if (!v?.lookAt || !anims.length) return;
    previewRef.current = true;
    setPreviewing(true);
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const hf = pbSettings.hfov;
    try {
      v.lookAt(anims[0].from.pitch, anims[0].from.yaw, hf, 600);
      await wait(650);
      for (let i = 0; i < anims.length; i++) {
        if (!previewRef.current) return;
        const a = anims[i];
        const panMs = panDurationMs(a, pbSettings);
        v.lookAt(a.to.pitch, a.to.yaw, hf, panMs);
        await wait(panMs);
        const next = anims[i + 1];
        if (next) {
          if (!previewRef.current) return;
          const tMs = transitionDurationMs(a.to, next.from, pbSettings);
          v.lookAt(next.from.pitch, next.from.yaw, hf, tMs);
          await wait(tMs);
        }
      }
    } finally {
      previewRef.current = false;
      setPreviewing(false);
    }
  }, [viewerHandle, playbackDrafts, currentSceneId, pbSettings]);

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

  const exportPlaybackSettings = useCallback(() => {
    const { panSpeed, transitionSpeed, staticHoldMs, hfov } = pbSettings;
    return `  playback: { panSpeed: ${panSpeed}, transitionSpeed: ${transitionSpeed}, staticHoldMs: ${staticHoldMs}, hfov: ${hfov} },`;
  }, [pbSettings]);

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
    const allHs = [
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
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 199, pointerEvents: 'none', width: 80, height: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, border: `2px solid ${CYAN}`, borderRadius: '50%', boxShadow: '0 0 12px rgba(93,213,240,0.6), inset 0 0 8px rgba(93,213,240,0.3)', opacity: 0.85 }} />
        <div style={{ position: 'absolute', width: 36, height: 36, border: '1px solid rgba(93,213,240,0.6)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: 80, height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(93,213,240,0.9) 30%, rgba(93,213,240,0.9) 70%, transparent 100%)' }} />
        <div style={{ position: 'absolute', width: 1, height: 80, background: 'linear-gradient(to bottom, transparent 0%, rgba(93,213,240,0.9) 30%, rgba(93,213,240,0.9) 70%, transparent 100%)' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 0 6px #5DD5F0, 0 0 2px #FFF' }} />
        <div
          style={{
            position: 'absolute', top: '100%', marginTop: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)', border: `1px solid rgba(93,213,240,0.5)`, borderRadius: 6,
            padding: '4px 10px', fontFamily: MONO, fontSize: 12, color: CYAN, whiteSpace: 'nowrap',
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
          position: 'absolute', top: 64, left: 12, zIndex: 200,
          background: 'rgba(8,8,10,0.92)', border: `1px solid rgba(142,104,73,0.4)`, borderRadius: 12,
          width: collapsed ? 'auto' : 366, maxWidth: 420,
          fontFamily: MONO, fontSize: 12, color: CREAM,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}
      >
        {/* ── Barra de título ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px',
            background: 'linear-gradient(90deg, rgba(93,213,240,0.10), transparent)',
            borderBottom: collapsed ? 'none' : '1px solid rgba(142,104,73,0.2)',
          }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            title="Colapsar / expandir todo (tecla D)"
            style={btn('cyan', { padding: '3px 9px', fontSize: 11, letterSpacing: 0.5 })}
          >
            {collapsed ? '▶' : '▼'} DEBUG
          </button>
          {!collapsed && (
            <>
              <span style={{ flex: 1, fontSize: 10, opacity: 0.5 }}>
                {sceneList.length ? `escena ${sceneIdx + 1}/${sceneList.length}` : ''}
              </span>
              <button
                onClick={() => setOpenSections(new Set(ALL_SECTIONS))}
                title="Expandir todas las secciones"
                style={btn('ghost', { padding: '3px 7px', fontSize: 13, lineHeight: 1 })}
              >
                ⊕
              </button>
              <button
                onClick={() => setOpenSections(new Set())}
                title="Colapsar todas las secciones"
                style={btn('ghost', { padding: '3px 7px', fontSize: 13, lineHeight: 1 })}
              >
                ⊖
              </button>
            </>
          )}
        </div>

        {!collapsed && (
          <>
            {/* ── Salto rápido (siempre visible) ── */}
            <div style={{ padding: '9px 11px', borderBottom: '1px solid rgba(142,104,73,0.2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, opacity: 0.5, width: 38 }}>APTO</span>
                <select
                  value={selectedApartment?.id ?? ''}
                  onChange={(e) => {
                    const apt = allApartments.find((a) => a.id === e.target.value);
                    if (apt) setApartmentAtScene(apt, apt.scenes[0]?.id ?? '');
                  }}
                  title="Saltar a otro apartamento"
                  style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                >
                  {allApartments.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, opacity: 0.5, width: 38 }}>ESCENA</span>
                <button onClick={() => goScene(-1)} title="Escena anterior" style={btn('ghost', { padding: '3px 8px' })}>‹</button>
                <select
                  value={currentSceneId}
                  onChange={(e) => setCurrentScene(e.target.value)}
                  title="Saltar a otra escena"
                  style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                >
                  {sceneList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button onClick={() => goScene(1)} title="Escena siguiente" style={btn('ghost', { padding: '3px 8px' })}>›</button>
              </div>
            </div>

            {/* ── Coordenadas en vivo (siempre visible) ── */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 11px', borderBottom: '1px solid rgba(142,104,73,0.2)',
                background: 'rgba(93,213,240,0.05)',
              }}
            >
              <div style={{ fontSize: 11 }}>
                <span style={{ opacity: 0.5 }}>yaw </span>
                <b style={{ fontSize: 13 }}>{coords.yaw}</b>
                <span style={{ opacity: 0.3, margin: '0 6px' }}>·</span>
                <span style={{ opacity: 0.5 }}>pitch </span>
                <b style={{ fontSize: 13 }}>{coords.pitch}</b>
                <span style={{ opacity: 0.3, margin: '0 6px' }}>·</span>
                <span style={{ opacity: 0.5 }}>hfov </span>
                <span style={{ opacity: 0.85 }}>{coords.hfov}</span>
              </div>
              <button
                onClick={() => copy(`pitch: ${coords.pitch}, yaw: ${coords.yaw}`, 'pair')}
                title="Copiar pitch/yaw del crosshair"
                style={btn('cyan', { padding: '3px 9px' })}
              >
                {copied === 'pair' ? '✓' : 'copy p/y'}
              </button>
            </div>

            {/* ── Secciones desplegables ── */}
            <div style={{ maxHeight: '64vh', overflowY: 'auto' }}>
              {/* 📍 HOTSPOTS */}
              <Section
                icon="📍"
                title="Hotspots"
                badge={(currentScene?.hotspots.length ?? 0) + drafts.length}
                open={openSections.has('hotspots')}
                onToggle={() => toggleSection('hotspots')}
                hint="Apunta el crosshair (arrastra la escena) hacia una puerta y agrega el hotspot. Luego expórtalo en la sección Exportar."
              >
                <button onClick={addDraftHotspot} style={btn('cyan', { width: '100%', border: `1px dashed rgba(93,213,240,0.5)`, marginBottom: 8 })}>
                  + Agregar hotspot en el crosshair
                </button>

                {drafts.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={labelStyle}>Nuevos drafts ({drafts.length})</div>
                    {drafts.map((d) => (
                      <div key={d.id} style={{ background: 'rgba(93,213,240,0.08)', border: '1px solid rgba(93,213,240,0.3)', borderRadius: 5, padding: 6, marginBottom: 4 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                          <input value={d.label} onChange={(e) => updateDraft(d.id, { label: e.target.value })} placeholder="Label" style={{ ...inputStyle, flex: 1 }} />
                          <button onClick={() => removeDraft(d.id)} title="Eliminar draft" style={btn('danger', { padding: '2px 7px' })}>×</button>
                        </div>
                        <select value={d.targetSceneId ?? ''} onChange={(e) => updateDraft(d.id, { targetSceneId: e.target.value })} style={{ ...inputStyle, width: '100%', marginBottom: 3 }}>
                          <option value="">-- escena destino --</option>
                          {sceneList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: 9 }}>
                          <span>pitch: {d.pitch}</span>
                          <span>yaw: {d.yaw}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentScene?.hotspots && currentScene.hotspots.length > 0 && (
                  <>
                    <div style={labelStyle}>En config ({currentScene.hotspots.length})</div>
                    {currentScene.hotspots.map((h) => {
                      const dYaw = Math.round((coords.yaw - (h.yaw ?? 0)) * 10) / 10;
                      const aligned = Math.abs(dYaw) < 3;
                      return (
                        <div
                          key={h.id}
                          style={{
                            background: aligned ? 'rgba(93,213,240,0.12)' : 'rgba(255,255,255,0.04)',
                            border: aligned ? '1px solid rgba(93,213,240,0.4)' : '1px solid transparent',
                            borderRadius: 5, padding: '5px 7px', marginBottom: 3, fontSize: 10,
                            display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 6, alignItems: 'center',
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{h.label}</span>
                          <span style={{ opacity: 0.6, fontSize: 9 }}>p:{h.pitch} y:{h.yaw}</span>
                          <span style={{ fontSize: 9, color: aligned ? CYAN : 'rgba(142,104,73,0.45)', minWidth: 32, textAlign: 'right' }}>
                            Δ{dYaw > 0 ? '+' : ''}{dYaw}
                          </span>
                          <button
                            onClick={() => { try { viewerHandle.current?.lookAt?.(h.pitch, h.yaw, 100); } catch {} }}
                            title="Apuntar la cámara al hotspot"
                            style={btn('ghost', { padding: '1px 7px', fontSize: 9 })}
                          >
                            go
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </Section>

              {/* 🎚️ VARIANTES */}
              <Section
                icon="🎚️"
                title="Variantes"
                badge={currentScene?.variants?.length ?? 0}
                open={openSections.has('variants')}
                onToggle={() => toggleSection('variants')}
                hint="Variantes de la escena (ej. amueblado / obra gris) y posición del botón para alternarlas."
              >
                {currentScene?.variants && currentScene.variants.length > 0 ? (
                  <>
                    <div style={labelStyle}>Variantes ({currentScene.variants.length})</div>
                    {currentScene.variants.map((v) => (
                      <div key={v.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: '5px 7px', marginBottom: 3, fontSize: 10 }}>
                        <div style={{ fontWeight: 600 }}>{v.label}</div>
                        <div style={{ opacity: 0.55, fontSize: 9 }}>
                          {v.linkSceneId ? `→ link a ${v.linkSceneId}` : v.panorama?.split('/').pop()}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(142,104,73,0.18)' }}>
                      <div style={labelStyle}>Botón de variante</div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: '5px 7px', marginBottom: 6, fontSize: 10, opacity: 0.85 }}>
                        actual:{' '}
                        {currentScene.variantButton ? `p:${currentScene.variantButton.pitch}, y:${currentScene.variantButton.yaw}` : '(no fijado)'}
                      </div>
                      {draftVariantBtn && (
                        <div style={{ background: 'rgba(93,213,240,0.12)', border: '1px solid rgba(93,213,240,0.4)', borderRadius: 5, padding: '5px 7px', marginBottom: 6, fontSize: 10 }}>
                          <b style={{ color: CYAN }}>draft:</b> p:{draftVariantBtn.pitch}, y:{draftVariantBtn.yaw}
                        </div>
                      )}
                      <button onClick={setVariantBtnHere} style={btn('cyan', { width: '100%', border: `1px dashed rgba(93,213,240,0.5)` })}>
                        + Fijar botón de variante en el crosshair
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.5, fontSize: 11, padding: 4 }}>Esta escena no tiene variantes definidas.</div>
                )}
              </Section>

              {/* 🎬 REPRODUCCIÓN */}
              <Section
                icon="🎬"
                title="Reproducción"
                badge={pbAnims.length}
                open={openSections.has('playback')}
                onToggle={() => toggleSection('playback')}
                hint={<>Recorrido <b style={{ color: CYAN }}>hacia las salidas</b>. Ajusta velocidad/HFOV, captura tramos o genéralos desde los hotspots, previsualiza y exporta.</>}
              >
                {/* Ajustes de velocidad / HFOV */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(142,104,73,0.18)', borderRadius: 6, padding: 7, marginBottom: 8 }}>
                  <div style={labelStyle}>Velocidad / HFOV (preview + export)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {([
                      ['Pan °/s', 'panSpeed', 1, 40, 1],
                      ['Transición °/s', 'transitionSpeed', 2, 80, 1],
                      ['Toma fija (ms)', 'staticHoldMs', 500, 8000, 100],
                      ['HFOV', 'hfov', 60, 150, 1],
                    ] as const).map(([label, key, min, max, step]) => (
                      <label key={key} style={{ fontSize: 9, opacity: 0.85, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{label}: <b style={{ color: CYAN }}>{pbSettings[key]}</b></span>
                        <input
                          type="range" min={min} max={max} step={step} value={pbSettings[key]}
                          onChange={(e) => setPbSettings((s) => ({ ...s, [key]: Number(e.target.value) }))}
                          style={{ width: '100%', accentColor: CYAN }}
                        />
                      </label>
                    ))}
                  </div>
                  <button onClick={() => copy(exportPlaybackSettings(), 'pb-settings')} style={btn('cyan', { width: '100%', marginTop: 7 })}>
                    {copied === 'pb-settings' ? '✓ ajustes copiados' : 'Copiar ajustes (bloque playback)'}
                  </button>
                </div>

                {/* Autogenerar + toma estática */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  <button onClick={genFromExits} title="Crea una toma por cada salida (hotspot), ordenadas por yaw" style={btn('cyan', { flex: 1 })}>
                    ⚡ Generar desde salidas
                  </button>
                  <button onClick={addStaticHold} title="Agrega una toma estática mirando hacia el crosshair" style={btn('ghost')}>
                    + estática
                  </button>
                </div>

                {/* Captura from → to */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6, padding: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(142,104,73,0.18)' }}>
                  <button onClick={markFrom} title="Marca la vista actual como inicio del tramo" style={btn('cyan', { flex: 1, border: `1px dashed rgba(93,213,240,0.5)`, background: pendingFrom ? 'rgba(93,213,240,0.28)' : 'rgba(93,213,240,0.12)' })}>
                    {pendingFrom ? `FROM ✓ (y:${pendingFrom.yaw})` : '① Marcar inicio'}
                  </button>
                  <button onClick={addSegment} title="Agrega el tramo desde el inicio marcado hasta la vista actual" style={btn('cyan', { flex: 1, border: `1px dashed rgba(93,213,240,0.5)`, background: 'rgba(93,213,240,0.12)' })}>
                    ② Agregar tramo → aquí
                  </button>
                </div>

                <button
                  onClick={previewing ? stopPreview : previewPlayback}
                  disabled={!pbAnims.length}
                  style={btn(previewing ? 'danger' : 'green', { width: '100%', padding: '7px 10px', fontSize: 11, marginBottom: 8, cursor: pbAnims.length ? 'pointer' : 'not-allowed', opacity: pbAnims.length ? 1 : 0.4 })}
                >
                  {previewing ? '■ Detener preview' : '▶ Previsualizar recorrido'}
                </button>

                {pbAnims.length > 0 ? (
                  <>
                    <div style={labelStyle}>Tramos ({pbAnims.length})</div>
                    {pbAnims.map((a, i) => {
                      const isStatic = Math.abs(a.from.yaw - a.to.yaw) < 1 && Math.abs(a.from.pitch - a.to.pitch) < 1;
                      return (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: '4px 7px', marginBottom: 3, fontSize: 10, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ opacity: 0.45, minWidth: 16 }}>{i + 1}</span>
                          <span style={{ flex: 1, fontSize: 9 }}>
                            {isStatic ? (<>mira <b>y:{a.to.yaw}</b> p:{a.to.pitch}</>) : (<>y:{a.from.yaw}→<b>{a.to.yaw}</b> · p:{a.from.pitch}→{a.to.pitch}</>)}
                          </span>
                          <button onClick={() => { try { viewerHandle.current?.lookAt?.(a.from.pitch, a.from.yaw, pbSettings.hfov, 400); } catch {} }} title="Apuntar al inicio de este tramo" style={btn('ghost', { padding: '1px 7px', fontSize: 9 })}>go</button>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <button onClick={removeLastSegment} style={btn('warn', { flex: 1 })}>↶ Quitar último</button>
                      <button onClick={clearSceneAnims} style={btn('danger', { flex: 1 })}>× Limpiar escena</button>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <button onClick={() => copy(exportPlaybackScene(), 'pb-scene')} style={btn('cyan', { flex: 1 })}>
                        {copied === 'pb-scene' ? '✓ copiado' : 'Copiar esta escena'}
                      </button>
                      <button onClick={() => copy(exportPlaybackAll(), 'pb-all')} title="Exporta las animaciones de todas las escenas capturadas" style={btn('cyan', { flex: 1, background: 'rgba(93,213,240,0.1)' })}>
                        {copied === 'pb-all' ? '✓ copiado' : 'Copiar TODAS'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.5, fontSize: 10, padding: 4, textAlign: 'center' }}>
                    Sin tramos aún. Usa <b style={{ color: CYAN }}>⚡ Generar desde salidas</b> o captura con ① / ②.
                  </div>
                )}
              </Section>

              {/* 🗺️ FLOOR PLAN */}
              <Section
                icon="🗺️"
                title="Floor plan"
                badge={selectedApartment?.floorPlan?.rooms?.length ?? 0}
                open={openSections.has('plan')}
                onToggle={() => toggleSection('plan')}
                hint={<>Para mover las burbujas, abre el Floor Plan (ícono mapa en la sidebar) y expándelo: ahí está el modo arrastre y el botón <b style={{ color: CYAN }}>copiar todo</b>.</>}
              >
                {(selectedApartment?.floorPlan?.rooms ?? []).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: r.sceneId === currentSceneId ? 'rgba(93,213,240,0.12)' : 'rgba(255,255,255,0.04)',
                      border: r.sceneId === currentSceneId ? '1px solid rgba(93,213,240,0.4)' : '1px solid transparent',
                      borderRadius: 5, padding: '5px 7px', marginBottom: 3, fontSize: 10,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    <span style={{ opacity: 0.6, fontSize: 9 }}>dx:{r.dotX} dy:{r.dotY}</span>
                  </div>
                ))}
              </Section>

              {/* 📤 EXPORTAR */}
              <Section
                icon="📤"
                title="Exportar"
                open={openSections.has('export')}
                onToggle={() => toggleSection('export')}
                hint={<>Snippets TS listos para pegar en <code style={{ color: CYAN }}>tour.config.ts</code>. Ajusta el helper <code>PANO()</code> y el <code>defaultView</code> a mano si quieres.</>}
              >
                <button onClick={() => copy(exportSceneSnippet(), 'export-scene')} style={btn('cyan', { width: '100%', padding: '7px 10px', fontSize: 11, marginBottom: 6, textAlign: 'left' })}>
                  {copied === 'export-scene' ? '✓ Escena copiada (drafts + variantButton)' : 'Exportar escena actual completa'}
                </button>
                <button onClick={() => copy(exportFloorPlanSnippet(), 'export-plan')} style={btn('cyan', { width: '100%', padding: '7px 10px', fontSize: 11, textAlign: 'left' })}>
                  {copied === 'export-plan' ? '✓ Floor plan copiado' : 'Exportar floor plan completo'}
                </button>
              </Section>

              {/* ✅ VALIDACIÓN */}
              <Section
                icon={validation && validation.issues.length === 0 ? '✅' : '⚠️'}
                title="Validación"
                badge={validation?.issues.length ?? 0}
                badgeTone={validation && validation.issues.length === 0 ? 'green' : 'red'}
                open={openSections.has('check')}
                onToggle={() => toggleSection('check')}
                hint="Revisa hotspots rotos, caminos sin vuelta (A→B sin B→A) y escenas a las que nadie llega."
              >
                {validation && validation.issues.length === 0 ? (
                  <div style={{ padding: 8, background: 'rgba(80,200,120,0.12)', border: '1px solid rgba(80,200,120,0.4)', borderRadius: 5, color: '#80E090', fontSize: 11, textAlign: 'center' }}>
                    ✓ Sin problemas detectados en este apartamento
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6, fontSize: 9 }}>
                      <span style={{ background: 'rgba(255,80,80,0.15)', color: '#FF8888', padding: '2px 6px', borderRadius: 3 }}>rotos: {validation?.byKind.broken ?? 0}</span>
                      <span style={{ background: 'rgba(255,180,80,0.15)', color: '#FFC080', padding: '2px 6px', borderRadius: 3 }}>sin vuelta: {validation?.byKind['missing-reciprocal'] ?? 0}</span>
                      <span style={{ background: 'rgba(180,180,180,0.15)', color: '#CCCCCC', padding: '2px 6px', borderRadius: 3 }}>huérfanas: {validation?.byKind.orphan ?? 0}</span>
                    </div>
                    {validation?.issues.map((i, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 9, padding: '4px 6px', marginBottom: 3,
                          background: i.kind === 'broken' ? 'rgba(255,80,80,0.08)' : i.kind === 'missing-reciprocal' ? 'rgba(255,180,80,0.08)' : 'rgba(180,180,180,0.08)',
                          borderLeft: i.kind === 'broken' ? '2px solid #FF8888' : i.kind === 'missing-reciprocal' ? '2px solid #FFC080' : '2px solid #888',
                          borderRadius: 3, color: CREAM, lineHeight: 1.4,
                        }}
                      >
                        {i.msg}
                      </div>
                    ))}
                  </>
                )}
              </Section>
            </div>

            {/* Footer */}
            <div style={{ fontSize: 9, opacity: 0.4, padding: '6px 11px 8px', borderTop: '1px solid rgba(142,104,73,0.14)', lineHeight: 1.4 }}>
              <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '0 4px', borderRadius: 2 }}>D</kbd> colapsa todo · arrastra la escena para apuntar el crosshair · ‹ › cambian de escena
            </div>
          </>
        )}
      </div>
    </>
  );
}
