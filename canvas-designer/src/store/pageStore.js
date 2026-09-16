import { create } from 'zustand';

const STORAGE_KEY = 'canvas_designer_pages';

function loadPages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data === 'object' && !Array.isArray(data)) return data;
    }
  } catch { /* ignore */ }
  return {};
}

function savePages(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

/**
 * Page store — manages page codes per system.
 * Data shape: { [systemCode]: [{ code, name }] }
 */
export const usePageStore = create((set, get) => ({
  pagesBySystem: loadPages(),

  /** Get pages for a given system */
  getBySystem: (systemCode) => get().pagesBySystem[systemCode] || [],

  /** Add a page to a system */
  addPage: (systemCode, page) => {
    const map = { ...get().pagesBySystem };
    const list = [...(map[systemCode] || [])];
    if (!list.some((p) => p.code === page.code)) {
      list.push({ code: page.code.trim(), name: page.name?.trim() || page.code });
    }
    map[systemCode] = list;
    savePages(map);
    set({ pagesBySystem: map });
  },

  /** Ensure a page code exists in a system (upsert) */
  ensureExists: (systemCode, pageCode) => {
    if (!pageCode) return;
    const map = { ...get().pagesBySystem };
    const list = [...(map[systemCode] || [])];
    if (!list.some((p) => p.code === pageCode)) {
      list.push({ code: pageCode, name: pageCode });
      map[systemCode] = list;
      savePages(map);
      set({ pagesBySystem: map });
    }
  },

  /** Remove a page from a system */
  removePage: (systemCode, pageCode) => {
    const map = { ...get().pagesBySystem };
    const list = (map[systemCode] || []).filter((p) => p.code !== pageCode);
    map[systemCode] = list;
    savePages(map);
    set({ pagesBySystem: map });
  },
}));
