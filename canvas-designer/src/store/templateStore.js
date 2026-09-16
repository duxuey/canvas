import { create } from 'zustand';
import { pageTemplateApi } from '../api/pageTemplateApi';

export const useTemplateStore = create((set) => ({
  templates: [],
  loading: false,
  error: null,

  loadTemplates: async (systemCode) => {
    set({ loading: true, error: null });
    try {
      const data = await pageTemplateApi.queryBySystem(systemCode);
      set({ templates: data?.templates || [] });
    } catch (e) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  saveTemplate: async (input) => {
    return await pageTemplateApi.save(input);
  },

  deleteTemplate: async (templateCode) => {
    return await pageTemplateApi.delete(templateCode);
  },
}));
