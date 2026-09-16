import { create } from 'zustand';
import { elementGroupApi } from '../api/elementGroupApi';

let nextId = 1;

export const useComponentStore = create((set, get) => ({
  components: [],
  loading: false,
  error: null,

  // Current editing component state
  editingCode: null,
  editElements: [],       // elements inside the component being edited
  editColumns: 2,
  editName: '',
  editDesc: '',
  editType: 'form',

  // --- CRUD ---
  loadComponents: async (systemCode) => {
    set({ loading: true, error: null });
    try {
      const data = await elementGroupApi.queryBySystem(systemCode);
      set({ components: data?.groups || [] });
    } catch (e) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  saveComponent: async (input) => {
    return await elementGroupApi.save(input);
  },

  deleteComponent: async (groupCode) => {
    return await elementGroupApi.delete(groupCode);
  },

  // --- Editing ---
  startEdit: (comp) => {
    // Parse elements from either raw array or JSON wrapper {columns, elements}
    let raw = comp?.elements || comp?.c_elements_json || [];
    let storedColumns = comp?.columns || 2;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    // Check if it's the wrapper format {columns, elements}
    let elems = [];
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.elements) {
      storedColumns = raw.columns || storedColumns;
      elems = raw.elements;
    } else if (Array.isArray(raw)) {
      elems = raw;
    }
    const elements = elems.map((e, i) => ({
      ...e, _id: i + 1, _rowIdx: e._rowIdx ?? 0, _colIdx: e._colIdx ?? i,
    }));
    set({
      editingCode: comp?.c_group_code || comp?.code || '',
      editElements: elements,
      editColumns: storedColumns,
      editName: comp?.c_group_name || comp?.name || '',
      editDesc: comp?.c_group_desc || comp?.desc || '',
      editType: comp?.c_group_type || comp?.type || 'form',
    });
  },

  cancelEdit: () => set({
    editingCode: null, editElements: [], editColumns: 2,
    editName: '', editDesc: '', editType: 'form',
  }),

  setEditMeta: (patch) => set(patch),

  // --- Element operations inside component editor ---
  addElement: (controlType, rowIdx, colIdx, extra = {}) => {
    const id = nextId++;
    const el = {
      _id: id,
      control_type: controlType,
      elem_code: extra.elem_code || `elem_${id}`,
      elem_name: extra.elem_name || controlType,
      elem_ename: extra.elem_ename || '',
      rel_field_name: extra.rel_field_name || '',
      rel_table_name: extra.rel_table_name || '',
      required_flag: extra.required_flag || '0',
      visible_flag: extra.visible_flag || '1',
      readonly_flag: extra.readonly_flag || '0',
      enabled_flag: extra.enabled_flag || '1',
      default_value: extra.default_value || '',
      placeholder: extra.placeholder || '',
      check_type: extra.check_type || 'none',
      min_value: extra.min_value || '',
      max_value: extra.max_value || '',
      string_length: extra.string_length || '',
      code_list_name: extra.code_list_name || '',
      control_attr: extra.control_attr || '',
      _rowIdx: rowIdx,
      _colIdx: colIdx,
    };
    set((s) => ({ editElements: [...s.editElements, el] }));
    return el._id;
  },

  updateElement: (id, patch) => set((s) => ({
    editElements: s.editElements.map((e) => (e._id === id ? { ...e, ...patch } : e)),
  })),

  removeElement: (id) => set((s) => ({
    editElements: s.editElements.filter((e) => e._id !== id),
  })),

  reorderElements: (fromIdx, toIdx) => set((s) => {
    const els = [...s.editElements];
    const [moved] = els.splice(fromIdx, 1);
    els.splice(toIdx, 0, moved);
    return { editElements: els };
  }),

  // --- Serialize for saving ---
  getComponentJson: () => {
    const s = get();
    return {
      c_group_code: s.editingCode,
      c_group_name: s.editName,
      c_group_desc: s.editDesc,
      c_group_type: s.editType,
      columns: s.editColumns,
      elements: s.editElements.map((e) => {
        const { _id, _rowIdx, _colIdx, ...rest } = e;
        return { ...rest, _rowIdx, _colIdx };
      }),
    };
  },
}));
