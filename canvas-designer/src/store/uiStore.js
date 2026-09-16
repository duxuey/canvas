import { create } from 'zustand';

export const useUiStore = create((set) => ({
  selectedId: null,
  selectedType: null, // 'section' | 'table' | 'element' | 'component' | 'button' | 'page'
  selectedItemType: null, // 'section' | 'table' | 'element' | 'component' — the itemType of selected item
  previewOpen: false,
  sidebarTab: 'components', // 'elements' | 'components'（画布设计器默认展示组件）
  toasts: [],

  templatePickerOpen: false,

  select: (id, type, itemType) => set({ selectedId: id, selectedType: type, selectedItemType: itemType || null }),
  clearSelection: () => set({ selectedId: null, selectedType: null, selectedItemType: null }),

  openTemplatePicker: () => set({ templatePickerOpen: true }),
  closeTemplatePicker: () => set({ templatePickerOpen: false }),
  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  addToast: (message, type = 'info') => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
}));
