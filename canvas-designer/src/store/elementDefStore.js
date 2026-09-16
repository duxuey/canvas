import { create } from 'zustand';
import { elementDefApi } from '../api/elementDefApi';

export const useElementDefStore = create((set, get) => ({
  defs: [],
  loading: false,

  loadDefs: async (systemCode) => {
    set({ loading: true });
    try {
      const data = await elementDefApi.queryBySystem(systemCode);
      set({ defs: data?.defs || data?.elements || [] });
    } catch (e) {
      console.error('Load element defs failed:', e);
      set({ defs: [] });
    } finally {
      set({ loading: false });
    }
  },

  saveDef: async (input) => {
    const result = await elementDefApi.save(input);
    return result;
  },

  deleteDef: async (code, systemCode) => {
    await elementDefApi.delete(code, systemCode);
  },

  getDefByCode: (code) => {
    return get().defs.find((d) => d.elem_code === code || d.code === code);
  },
}));
