import { create } from 'zustand';
import { elementGroupApi } from '../api/elementGroupApi';

export const useElementGroupStore = create((set) => ({
  groups: [],
  loading: false,

  loadGroups: async (systemCode) => {
    set({ loading: true });
    try {
      const data = await elementGroupApi.queryBySystem(systemCode);
      set({ groups: data?.groups || [] });
    } catch (e) {
      console.error('Load groups failed:', e);
    } finally {
      set({ loading: false });
    }
  },

  saveGroup: async (input) => {
    const result = await elementGroupApi.save(input);
    return result;
  },

  deleteGroup: async (groupCode) => {
    await elementGroupApi.delete(groupCode);
  },

  queryItems: async (groupCode) => {
    const data = await elementGroupApi.queryItems(groupCode);
    return data?.items || [];
  },

  addItem: async (input) => {
    await elementGroupApi.addItem(input);
  },

  deleteItem: async (groupCode, elemCode) => {
    await elementGroupApi.deleteItem(groupCode, elemCode);
  },
}));
