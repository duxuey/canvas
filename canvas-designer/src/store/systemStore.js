import { create } from 'zustand';

const STORAGE_KEY = 'canvas_designer_systems';

function loadSystems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch { /* ignore */ }
  // Default system
  return [
    { code: 'SYS01', name: '默认系统', description: '系统默认租户' },
  ];
}

function saveSystems(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export const useSystemStore = create((set, get) => ({
  systems: loadSystems(),

  /** Get all systems as {code, name, description}[] */
  getAll: () => get().systems,

  /** Add a new system */
  addSystem: (system) => {
    const updated = [...get().systems, {
      code: system.code.trim(),
      name: system.name.trim() || system.code,
      description: system.description || '',
    }];
    saveSystems(updated);
    set({ systems: updated });
  },

  /** Update an existing system by code */
  updateSystem: (oldCode, patch) => {
    const updated = get().systems.map((s) =>
      s.code === oldCode
        ? { ...s, ...patch, code: patch.code?.trim() || s.code }
        : s
    );
    saveSystems(updated);
    set({ systems: updated });
  },

  /** Delete a system by code */
  deleteSystem: (code) => {
    const updated = get().systems.filter((s) => s.code !== code);
    saveSystems(updated);
    set({ systems: updated });
  },

  /** Check if a system code exists */
  exists: (code) => get().systems.some((s) => s.code === code),
}));
