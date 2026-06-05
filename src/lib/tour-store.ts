'use client';

import { create } from 'zustand';
import tourConfig from '@/projects/melendez/mirrinao/tour.config';
import type { ApartmentConfig } from './tour-types';

interface TourState {
  config: typeof tourConfig;
  // Building selection
  selectedApartment: ApartmentConfig | null;
  setApartment: (apt: ApartmentConfig) => void;
  setApartmentAtScene: (apt: ApartmentConfig, sceneId: string) => void;
  clearApartment: () => void;
  // Scene navigation (within selected apartment)
  currentSceneId: string;
  currentSceneIndex: number;
  setCurrentScene: (id: string) => void;
  nextScene: () => void;
  prevScene: () => void;
  // Viewer orientation
  viewerYaw: number;
  setViewerYaw: (yaw: number) => void;
  // Scene variants (mismo cuarto, distinto amueblado)
  selectedVariants: Record<string, string>;  // sceneId -> variantId
  setSceneVariant: (sceneId: string, variantId: string) => void;
  // Galeria / Plantas viewer
  galleryOpen: 'gallery' | 'plantas' | null;
  openGallery: (kind: 'gallery' | 'plantas') => void;
  closeGallery: () => void;
  // Playback mode
  isPlaybackMode: boolean;
  /** true si el playback se activó automáticamente por inactividad */
  playbackAuto: boolean;
  startPlayback: (auto?: boolean) => void;
  stopPlayback: () => void;
  // UI
  isFullscreen: boolean;
  showFloorPlan: boolean;
  showSceneList: boolean;
  showLeftSidebar: boolean;
  autoRotate: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
  showInfoPanel: boolean;
  infoPanelData: { title: string; description: string } | null;
  // Actions
  toggleFullscreen: () => void;
  toggleFloorPlan: () => void;
  toggleSceneList: () => void;
  toggleLeftSidebar: () => void;
  toggleAutoRotate: () => void;
  setLoading: (v: boolean) => void;
  setTransitioning: (v: boolean) => void;
  showInfo: (title: string, description: string) => void;
  hideInfo: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  config: tourConfig,
  selectedApartment: null,

  setApartment: (apt) => set({
    selectedApartment: apt,
    currentSceneId: apt.scenes[0]?.id ?? '',
    currentSceneIndex: 0,
    showInfoPanel: false,
  }),

  setApartmentAtScene: (apt, sceneId) => {
    const idx = apt.scenes.findIndex(s => s.id === sceneId);
    set({
      selectedApartment: apt,
      currentSceneId: idx !== -1 ? sceneId : (apt.scenes[0]?.id ?? ''),
      currentSceneIndex: idx !== -1 ? idx : 0,
      showInfoPanel: false,
    });
  },

  clearApartment: () => set({
    selectedApartment: null,
    currentSceneId: '',
    currentSceneIndex: 0,
  }),

  currentSceneId: '',
  currentSceneIndex: 0,
  viewerYaw: 0,
  setViewerYaw: (yaw) => set({ viewerYaw: yaw }),
  selectedVariants: {},
  setSceneVariant: (sceneId, variantId) =>
    set((s) => ({ selectedVariants: { ...s.selectedVariants, [sceneId]: variantId } })),
  galleryOpen: null,
  openGallery: (kind) => set({ galleryOpen: kind }),
  closeGallery: () => set({ galleryOpen: null }),
  isPlaybackMode: false,
  playbackAuto: false,
  startPlayback: (auto = false) => set({ isPlaybackMode: true, playbackAuto: auto }),
  stopPlayback: () => set({ isPlaybackMode: false, playbackAuto: false }),
  isFullscreen: false,
  showFloorPlan: tourConfig.showFloorPlan,
  showSceneList: false,
  showLeftSidebar: false,
  autoRotate: tourConfig.autoRotateSpeed !== 0,
  isLoading: true,
  isTransitioning: false,
  showInfoPanel: false,
  infoPanelData: null,

  setCurrentScene: (id) => {
    const { selectedApartment } = get();
    const scenes = selectedApartment?.scenes ?? [];
    const idx = scenes.findIndex(s => s.id === id);
    if (idx !== -1) {
      // NO reseteamos viewerYaw — la direccion se preserva al cambiar de escena.
      // El polling del pano-viewer actualizara el yaw real cuando el nuevo viewer cargue.
      set({ currentSceneId: id, currentSceneIndex: idx, showInfoPanel: false });
    }
  },

  nextScene: () => {
    const { selectedApartment, currentSceneIndex } = get();
    const scenes = selectedApartment?.scenes ?? [];
    if (scenes.length === 0) return;
    const n = (currentSceneIndex + 1) % scenes.length;
    set({ currentSceneId: scenes[n].id, currentSceneIndex: n, showInfoPanel: false });
  },

  prevScene: () => {
    const { selectedApartment, currentSceneIndex } = get();
    const scenes = selectedApartment?.scenes ?? [];
    if (scenes.length === 0) return;
    const n = (currentSceneIndex - 1 + scenes.length) % scenes.length;
    set({ currentSceneId: scenes[n].id, currentSceneIndex: n, showInfoPanel: false });
  },

  toggleFullscreen: () => set(s => ({ isFullscreen: !s.isFullscreen })),
  toggleFloorPlan: () => set(s => ({ showFloorPlan: !s.showFloorPlan })),
  toggleSceneList: () => set(s => ({ showSceneList: !s.showSceneList })),
  toggleLeftSidebar: () => set(s => ({ showLeftSidebar: !s.showLeftSidebar })),
  toggleAutoRotate: () => set(s => ({ autoRotate: !s.autoRotate })),
  setLoading: (v) => set({ isLoading: v }),
  setTransitioning: (v) => set({ isTransitioning: v }),
  showInfo: (title, description) => set({ showInfoPanel: true, infoPanelData: { title, description } }),
  hideInfo: () => set({ showInfoPanel: false, infoPanelData: null }),
}));
