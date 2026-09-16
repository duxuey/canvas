import { create } from 'zustand';
import { getDefaults } from '../utils/elementDefaults';

let nextId = 1;
let nextTabId = 1;

/** 组成一个「画布」状态的字段 —— 用于多标签快照 */
const CANVAS_FIELDS = [
  'canvasId', 'canvasCode', 'canvasName', 'canvasEname', 'canvasType',
  'columns', 'buttonsLayout', 'systemCode', 'pageCode', 'templateCode',
  'items', 'buttons', 'config',
];

function freshCanvas() {
  return {
    canvasId: null, canvasCode: '', canvasName: 'Untitled Canvas', canvasEname: '',
    canvasType: 'form', columns: 2, buttonsLayout: 'bottom',
    systemCode: 'SYS01', pageCode: 'PAGE01', templateCode: '',
    items: [], buttons: [], config: {},
  };
}

function snapshotCanvas(s) {
  const snap = {};
  for (const f of CANVAS_FIELDS) snap[f] = s[f];
  return snap;
}

/** 把当前活动标签的实时状态回写到其快照（切换 / 新建标签前调用） */
function commitActive(s) {
  const snap = snapshotCanvas(s);
  return s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, snapshot: snap } : t));
}

/**
 * canvasStore — unified page/canvas store.
 * Items are an ordered list of blocks: section / table / component / free element.
 * A `section` holds nested childItems (element / component / table).
 */
export const useCanvasStore = create((set, get) => ({
  // --- Page meta ---
  canvasId: null,
  canvasCode: '',
  canvasName: 'Untitled Canvas',
  canvasEname: '',
  canvasType: 'form',
  columns: 2,
  buttonsLayout: 'bottom',
  systemCode: 'SYS01',
  pageCode: 'PAGE01',
  templateCode: '',

  // --- Structured items (NEW) ---
  /** @type {Array<{_id, itemType:'section'|'table'|'component'|'element', ...}>} */
  items: [],

  // --- Legacy flat arrays (kept for backward compat) ---
  buttons: [],
  config: {},

  // --- 多画布标签 ---
  tabs: [{ id: 1, snapshot: freshCanvas() }],
  activeTabId: 1,

  // --- Meta ---
  setMeta: (meta) => set(meta),
  setCanvasType: (type) => set({ canvasType: type }),
  setColumns: (n) => set({ columns: n }),

  // ================================================================
  // NEW: Item-based operations (for components / elements)
  // ================================================================

  /**
   * Add a structured item to the canvas.
   * @param {'section'|'table'|'component'|'element'} itemType
   * @param {object} ref - reference data
   * @param {number} [rowIdx]
   * @param {number} [colIdx]
   */
  addItem: (itemType, ref, rowIdx, colIdx) => {
    const id = nextId++;
    const item = buildItem(itemType, ref, id, rowIdx ?? 0, colIdx ?? get().items.length);
    set((s) => ({ items: [...s.items, item] }));
    return id;
  },

  updateItem: (id, patch) => set((s) => ({
    items: updateInList(s.items, id, patch),
  })),

  removeItem: (id) => set((s) => ({
    items: removeInList(s.items, id),
  })),

  /** Recursively locate an item by id (searches into section.childItems). */
  findItem: (id) => findInList(get().items, id),

  // --- Table block helpers ---
  addTable: (name) => get().addItem('table', { name: name || '数据列表' }),

  addTableColumn: (tableId, el) => set((s) => ({
    items: updateInList(s.items, tableId, (item) => ({
      childElements: [...(item.childElements || []), { ...el, _id: el._id || nextId++ }],
    })),
  })),

  removeTableColumn: (tableId, elId) => set((s) => ({
    items: updateInList(s.items, tableId, (item) => ({
      childElements: (item.childElements || []).filter((e) => e._id !== elId),
    })),
  })),

  // --- Section block helpers ---
  addSection: (name) => get().addItem('section', { name: name || '区块' }),

  // --- TabGroup (标签页容器) helpers ---
  addTabGroup: (name) => {
    const tabId = nextId++;
    const item = {
      _id: nextId++, itemType: 'tabGroup', refName: name || '标签页',
      _rowIdx: 0, _colIdx: get().items.length,
      tabs: [{ _id: tabId, name: '标签1', childItems: [] }],
      activeTabId: tabId,
    };
    set((s) => ({ items: [...s.items, item] }));
    return item._id;
  },

  addTab: (tabGroupId, name) => set((s) => ({
    items: updateInList(s.items, tabGroupId, (item) => {
      const tabId = nextId++;
      const label = (name && name.trim()) || `标签${(item.tabs || []).length + 1}`;
      return {
        tabs: [...(item.tabs || []), { _id: tabId, name: label, childItems: [] }],
        activeTabId: tabId,
      };
    }),
  })),

  removeTab: (tabGroupId, tabId) => set((s) => ({
    items: updateInList(s.items, tabGroupId, (item) => {
      const tabs = (item.tabs || []).filter((t) => t._id !== tabId);
      const activeTabId = item.activeTabId === tabId ? (tabs[0]?._id ?? null) : item.activeTabId;
      return { tabs, activeTabId };
    }),
  })),

  renameTab: (tabGroupId, tabId, name) => set((s) => ({
    items: updateInList(s.items, tabGroupId, (item) => ({
      tabs: (item.tabs || []).map((t) => (t._id === tabId ? { ...t, name } : t)),
    })),
  })),

  setActiveTab: (tabGroupId, tabId) => set((s) => ({
    items: updateInList(s.items, tabGroupId, { activeTabId: tabId }),
  })),

  addTabChild: (tabGroupId, tabId, itemType, ref) => {
    const child = buildItem(itemType, ref, nextId++, 0, 0);
    set((s) => ({
      items: updateInList(s.items, tabGroupId, (item) => ({
        tabs: (item.tabs || []).map((t) => (t._id === tabId ? { ...t, childItems: [...(t.childItems || []), child] } : t)),
      })),
    }));
    return child._id;
  },

  removeTabChild: (tabGroupId, tabId, childId) => set((s) => ({
    items: updateInList(s.items, tabGroupId, (item) => ({
      tabs: (item.tabs || []).map((t) => (t._id === tabId ? { ...t, childItems: (t.childItems || []).filter((c) => c._id !== childId) } : t)),
    })),
  })),

  addSectionChild: (sectionId, itemType, ref) => {
    const child = buildItem(itemType, ref, nextId++, 0, 0);
    set((s) => ({
      items: updateInList(s.items, sectionId, (item) => ({
        childItems: [...(item.childItems || []), child],
      })),
    }));
    return child._id;
  },

  addComponentChild: (componentId, itemType, ref) => {
    const child = buildItem(itemType, ref, nextId++, 0, 0);
    set((s) => ({
      items: updateInList(s.items, componentId, (item) => ({
        childItems: [...(item.childItems || []), child],
      })),
    }));
    return child._id;
  },

  removeComponentChild: (componentId, childId) => set((s) => ({
    items: updateInList(s.items, componentId, (item) => ({
      childItems: (item.childItems || []).filter((c) => c._id !== childId),
    })),
  })),

  removeSectionChild: (sectionId, childId) => set((s) => ({
    items: updateInList(s.items, sectionId, (item) => ({
      childItems: (item.childItems || []).filter((c) => c._id !== childId),
    })),
  })),

  /** Reorder a section child by moving `fromId` to the position of `toId`. */
  reorderSectionChild: (sectionId, fromId, toId) => set((s) => ({
    items: updateInList(s.items, sectionId, (item) => {
      const kids = [...(item.childItems || [])];
      const fromIdx = kids.findIndex((k) => k._id === fromId);
      const toIdx = kids.findIndex((k) => k._id === toId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return {};
      const [moved] = kids.splice(fromIdx, 1);
      kids.splice(toIdx, 0, moved);
      return { childItems: kids };
    }),
  })),

  reorderItems: (fromIdx, toIdx) => set((s) => {
    const its = [...s.items];
    const [moved] = its.splice(fromIdx, 1);
    its.splice(toIdx, 0, moved);
    return { items: its };
  }),

  /** Reorder a top-level item by moving `fromId` to the position of `toId`. */
  reorderItemById: (fromId, toId) => set((s) => {
    const its = [...s.items];
    const fromIdx = its.findIndex((x) => x._id === fromId);
    const toIdx = its.findIndex((x) => x._id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return {};
    const [moved] = its.splice(fromIdx, 1);
    its.splice(toIdx, 0, moved);
    return { items: its };
  }),

  moveItem: (id, toRow, toCol) => set((s) => ({
    items: s.items.map((item) => (item._id === id ? { ...item, _rowIdx: toRow, _colIdx: toCol } : item)),
  })),

  /** 上移一个顶层块（与上一个块交换位置） */
  moveItemUp: (id) => set((s) => {
    const its = [...s.items];
    const idx = its.findIndex((x) => x._id === id);
    if (idx <= 0) return {};
    [its[idx - 1], its[idx]] = [its[idx], its[idx - 1]];
    return { items: its };
  }),

  /** 下移一个顶层块（与下一个块交换位置） */
  moveItemDown: (id) => set((s) => {
    const its = [...s.items];
    const idx = its.findIndex((x) => x._id === id);
    if (idx < 0 || idx >= its.length - 1) return {};
    [its[idx + 1], its[idx]] = [its[idx], its[idx + 1]];
    return { items: its };
  }),

  /**
   * 移动一个顶层块到指定位置。
   * @param {number} blockId 要移动的块 _id
   * @param {'top'|'bottom'|'above'|'below'} position
   * @param {number} [targetId] position 为 above/below 时的参考块 _id
   */
  moveBlockTo: (blockId, position, targetId) => set((s) => {
    const its = [...s.items];
    const fromIdx = its.findIndex((x) => x._id === blockId);
    if (fromIdx < 0) return {};
    const [moved] = its.splice(fromIdx, 1);

    let insertIdx;
    if (position === 'top') {
      insertIdx = 0;
    } else if (position === 'bottom') {
      insertIdx = its.length;
    } else if (position === 'above' || position === 'below') {
      const tIdx = its.findIndex((x) => x._id === targetId);
      if (tIdx < 0) return {};
      insertIdx = position === 'above' ? tIdx : tIdx + 1;
    } else {
      return {};
    }

    its.splice(insertIdx, 0, moved);
    return { items: its };
  }),

  // ================================================================
  // Legacy element operations (for backward compat)
  // These operate on the items array filtered to itemType==='element'
  // ================================================================

  addElement: (controlType, rowIdx, colIdx) => {
    return get().addItem('element', { controlType }, rowIdx, colIdx);
  },

  updateElement: (id, patch) => get().updateItem(id, patch),

  removeElement: (id) => get().removeItem(id),

  moveElement: (id, toRow, toCol) => get().moveItem(id, toRow, toCol),

  reorderElements: (fromIdx, toIdx) => set((s) => {
    const els = s.items.filter((x) => x.itemType === 'element');
    const [moved] = els.splice(fromIdx, 1);
    els.splice(toIdx, 0, moved);
    const nonElements = s.items.filter((x) => x.itemType !== 'element');
    return { items: [...nonElements, ...els] };
  }),

  // --- Button ops ---
  addButton: (button) => set((s) => ({ buttons: [...s.buttons, { ...button, _id: nextId++ }] })),
  removeButton: (id) => set((s) => ({ buttons: s.buttons.filter((b) => b._id !== id) })),
  updateButton: (id, patch) => set((s) => ({ buttons: s.buttons.map((b) => (b._id === id ? { ...b, ...patch } : b)) })),

  // ================================================================
  // Serialize / Deserialize
  // ================================================================

  getCanvasJson: () => {
    const s = get();
    const elementItems = s.items.filter((x) => x.itemType === 'element');
    const legacyElements = elementItems.map(({ _id, itemType, _rowIdx, _colIdx, ...rest }) => rest);
    const legacyButtons = s.buttons.map(({ _id, ...rest }) => rest);
    const allItems = s.items.map(({ _id, _rowIdx, _colIdx, ...rest }) => rest);

    return {
      c_canvas_code: s.canvasCode || '',
      c_canvas_name: s.canvasName,
      c_canvas_ename: s.canvasEname,
      canvasType: s.canvasType,
      columns: s.columns,
      buttonsLayout: s.buttonsLayout,
      compFlag: '',
      searchSql: '',
      insertSql: '',
      c_modify_func: '',
      c_calc_envelop_func: '',
      c_save_envelop_func: '',
      c_query_envelop_func: '',
      c_add_event_func: '',
      c_delete_event_func: '',
      c_create_event_func: '',
      c_verify_valid_func: '',
      c_add_control_attr: '',
      c_delete_control_attr: '',
      c_oprt_button: '',
      c_oprt_type: [],
      c_table_default_info: [],
      // Legacy fields for backward compat
      elements: legacyElements,
      buttons: legacyButtons,
      // New field
      items: allItems,
    };
  },

  /**
   * Generate a clean, portable publish JSON for cross-system consumption.
   * Uses camelCase field names (no DB `c_` prefix) and groups items by type.
   */
  getPublishJson: () => {
    const s = get();

    const mapElement = (e) => ({
      code: e.elem_code || '',
      name: e.elem_name || '',
      englishName: e.elem_ename || '',
      controlType: e.control_type || 'text',
      fieldName: e.rel_field_name || '',
      tableName: e.rel_table_name || '',
      required: e.required_flag === '1' || e.required_flag === true,
      visible: e.visible_flag !== '0',
      readonly: e.readonly_flag === '1',
      enabled: e.enabled_flag !== '0',
      defaultValue: e.default_value || '',
      placeholder: e.placeholder || '',
      tooltip: e.tooltip_title || '',
      checkType: e.check_type || 'none',
      codeListName: e.code_list_name || '',
      controlAttr: e.control_attr || '',
      minValue: e.min_value || '',
      maxValue: e.max_value || '',
      stringLength: e.string_length || '',
      columnWidth: e.column_width || 0,
    });

    const mapComponent = (c) => ({
      code: c.refCode || '',
      name: c.refName || '',
      columns: c.compColumns || 2,
      elements: (c.childElements || []).map(mapElement),
      items: (c.childItems || []).map(mapChildItem),
    });

    const mapTable = (t) => ({
      name: t.refName || '数据列表',
      columns: (t.childElements || []).map(mapElement),
    });

    const mapSection = (sec) => ({
      name: sec.refName || '区块',
      items: (sec.childItems || []).map(mapChildItem),
    });

    const mapTabGroup = (g) => ({
      name: g.refName || '标签页',
      tabs: (g.tabs || []).map((t) => ({
        name: t.name || '标签',
        items: (t.childItems || []).map(mapChildItem),
      })),
    });

    const mapChildItem = (item) => {
      if (item.itemType === 'component') return { type: 'component', ...mapComponent(item) };
      if (item.itemType === 'table') return { type: 'table', ...mapTable(item) };
      if (item.itemType === 'section') return { type: 'section', ...mapSection(item) };
      if (item.itemType === 'tabGroup') return { type: 'tabGroup', ...mapTabGroup(item) };
      return { type: 'element', ...mapElement(item) };
    };

    const mapButton = (b) => ({
      code: b.btn_code || b.code || '',
      name: b.btn_name || b.name || '',
      eventType: b.btn_event_type || b.eventType || '',
      displayText: b.btn_text || b.text || '',
      order: b.btn_order ?? b.order ?? 0,
    });

    const sections = [];
    const components = [];
    const tables = [];
    const tabGroups = [];
    const elements = [];

    for (const item of s.items) {
      if (item.itemType === 'section') {
        sections.push(mapSection(item));
      } else if (item.itemType === 'component') {
        components.push(mapComponent(item));
      } else if (item.itemType === 'table') {
        tables.push(mapTable(item));
      } else if (item.itemType === 'tabGroup') {
        tabGroups.push(mapTabGroup(item));
      } else {
        elements.push(mapElement(item));
      }
    }

    return {
      version: '1.0',
      publishedAt: new Date().toISOString(),
      page: {
        code: s.pageCode || '',
        name: s.canvasName || '',
        englishName: s.canvasEname || '',
        canvasCode: s.canvasCode || '',
        type: s.canvasType || 'form',
        systemCode: s.systemCode || '',
        templateCode: s.templateCode || '',
        layout: {
          columns: s.columns || 2,
          buttonPosition: s.buttonsLayout || 'bottom',
        },
        sections,
        components,
        tables,
        tabGroups,
        elements,
        buttons: s.buttons.map(mapButton),
      },
    };
  },

  /**
   * Load store state from a published JSON (reverse of getPublishJson).
   * Maps camelCase publish fields back to internal `c_` / snake_case fields.
   */
  loadFromPublishJson: (publishJson) => {
    const page = publishJson?.page;
    if (!page) return;

    const reverseElement = (e) => ({
      itemType: e.type || 'element',
      elem_code: e.code || '',
      elem_name: e.name || '',
      elem_ename: e.englishName || '',
      control_type: e.controlType || 'text',
      rel_field_name: e.fieldName || '',
      rel_table_name: e.tableName || '',
      required_flag: e.required ? '1' : '0',
      visible_flag: e.visible !== false ? '1' : '0',
      readonly_flag: e.readonly ? '1' : '0',
      enabled_flag: e.enabled !== false ? '1' : '0',
      default_value: e.defaultValue || '',
      placeholder: e.placeholder || '',
      tooltip_title: e.tooltip || '',
      check_type: e.checkType || 'none',
      code_list_name: e.codeListName || '',
      control_attr: e.controlAttr || '',
      min_value: e.minValue || '',
      max_value: e.maxValue || '',
      string_length: e.stringLength || '',
      column_width: e.columnWidth || 0,
    });

    const reverseComponent = (c) => ({
      itemType: 'component',
      refCode: c.code || '',
      refName: c.name || '',
      compColumns: c.columns || 2,
      childElements: (c.elements || []).map(reverseElement),
      childItems: (c.items || []).map(reverseChildItem),
    });

    const reverseTable = (t) => ({
      itemType: 'table',
      refName: t.name || '数据列表',
      childElements: (t.columns || []).map(reverseElement),
    });

    const reverseSection = (sec) => ({
      itemType: 'section',
      refName: sec.name || '区块',
      childItems: (sec.items || []).map(reverseChildItem),
    });

    const reverseTabGroup = (g) => ({
      itemType: 'tabGroup',
      refName: g.name || '标签页',
      tabs: (g.tabs || []).map((t) => ({
        name: t.name || '标签',
        childItems: (t.items || []).map(reverseChildItem),
      })),
    });

    const reverseChildItem = (c) => {
      if (c.type === 'component') return reverseComponent(c);
      if (c.type === 'table') return reverseTable(c);
      if (c.type === 'section') return reverseSection(c);
      if (c.type === 'tabGroup') return reverseTabGroup(c);
      return reverseElement(c);
    };

    const items = [];
    for (const sec of (page.sections || [])) {
      items.push(reverseSection(sec));
    }
    for (const c of (page.components || [])) {
      items.push(reverseComponent(c));
    }
    for (const t of (page.tables || [])) {
      items.push(reverseTable(t));
    }
    for (const g of (page.tabGroups || [])) {
      items.push(reverseTabGroup(g));
    }
    for (const e of (page.elements || [])) {
      items.push(reverseElement(e));
    }

    const buttons = (page.buttons || []).map((b) => ({
      btn_code: b.code || '',
      btn_name: b.name || '',
      btn_event_type: b.eventType || '',
      btn_text: b.displayText || '',
      btn_order: b.order ?? 0,
    }));

    set({
      canvasCode: page.canvasCode || '',
      canvasName: page.name || '',
      canvasEname: page.englishName || '',
      canvasType: page.type || 'form',
      columns: page.layout?.columns || 2,
      buttonsLayout: page.layout?.buttonPosition || 'bottom',
      systemCode: page.systemCode || 'SYS01',
      pageCode: page.code || 'PAGE01',
      templateCode: page.templateCode || '',
      items: items.map(hydrateItem),
      buttons: buttons.map((b) => ({ ...b, _id: nextId++ })),
    });
  },

  setFromCanvas: (data, meta) => {
    // If data has items[], use it; otherwise build items from legacy elements
    let rawItems = data?.items && data.items.length > 0
      ? data.items
      : (data?.elements || []).map((e) => ({ ...e, itemType: 'element' }));

    // Legacy migration: canvases saved as canvasType === 'table' had all elements
    // acting as columns of a single table. Wrap them into one table block so they
    // don't silently degrade into a form grid.
    const hasTable = rawItems.some((it) => it.itemType === 'table');
    if ((data?.canvasType === 'table') && !hasTable) {
      const elementItems = rawItems.filter((it) => (it.itemType || 'element') === 'element');
      const rest = rawItems.filter((it) => (it.itemType || 'element') !== 'element');
      if (elementItems.length > 0) {
        rawItems = [...rest, {
          itemType: 'table',
          refName: '数据列表',
          childElements: elementItems,
        }];
      }
    }

    set({
      canvasId: meta?.id || null,
      canvasCode: meta?.canvasCode || data?.c_canvas_code || '',
      canvasName: meta?.canvasName || data?.c_canvas_name || '',
      canvasEname: meta?.canvasEname || data?.c_canvas_ename || '',
      canvasType: data?.canvasType || meta?.canvasType || 'form',
      columns: data?.columns || meta?.columns || 2,
      buttonsLayout: data?.buttonsLayout || '',
      systemCode: meta?.systemCode || data?.systemCode || 'SYS01',
      pageCode: meta?.pageCode || data?.c_page_code || 'PAGE01',
      items: rawItems.map(hydrateItem),
      buttons: (data?.buttons || []).map((b) => ({ ...b, _id: nextId++ })),
    });
  },

  reset: () => set(freshCanvas()),

  // ================================================================
  // 多画布标签
  // ================================================================

  newTab: () => set((s) => {
    const tabs = commitActive(s);
    const id = nextTabId++;
    const fresh = freshCanvas();
    return { tabs: [...tabs, { id, snapshot: fresh }], activeTabId: id, ...fresh };
  }),

  switchTab: (id) => set((s) => {
    if (id === s.activeTabId) return {};
    const target = s.tabs.find((t) => t.id === id);
    if (!target) return {};
    return { tabs: commitActive(s), activeTabId: id, ...target.snapshot };
  }),

  closeTab: (id) => set((s) => {
    const idx = s.tabs.findIndex((t) => t.id === id);
    if (idx < 0) return {};
    let tabs = s.tabs.filter((t) => t.id !== id);
    const patch = { tabs };
    if (id === s.activeTabId) {
      const neighbor = tabs[idx] || tabs[idx - 1];
      if (neighbor) {
        patch.activeTabId = neighbor.id;
        Object.assign(patch, neighbor.snapshot);
      } else {
        const nid = nextTabId++;
        const fresh = freshCanvas();
        patch.tabs = [...tabs, { id: nid, snapshot: fresh }];
        patch.activeTabId = nid;
        Object.assign(patch, fresh);
      }
    }
    return patch;
  }),
}));

// ================================================================
// Module-level item helpers
// ================================================================

/** Build a single item (element / component / table / section) from a ref. */
function buildItem(itemType, ref, id, rowIdx, colIdx) {
  const base = { _id: id, itemType, _rowIdx: rowIdx ?? 0, _colIdx: colIdx ?? 0 };

  if (itemType === 'element') {
    const controlType = ref.controlType || 'text';
    const elemCode = ref.elemCode || ref.code || `elem_${id}`;
    const elemName = ref.elemName || ref.name || '';
    const defs = getDefaults(controlType);
    return {
      ...base,
      control_type: controlType,
      elem_code: elemCode,
      elem_name: elemName || defs.label || controlType,
      elem_ename: ref.elemEname || ref.ename || '',
      rel_field_name: ref.relFieldName || ref.fieldName || ref.rel_field_name || '',
      rel_table_name: ref.relTableName || ref.tableName || ref.rel_table_name || '',
      required_flag: ref.requiredFlag || ref.required ? '1' : '0',
      visible_flag: ref.visibleFlag || '1',
      readonly_flag: ref.readonlyFlag || '0',
      enabled_flag: ref.enabledFlag || '1',
      default_value: ref.defaultValue || ref.default_value || '',
      placeholder: ref.placeholder || '',
      tooltip_title: ref.tooltipTitle || ref.tooltip || ref.tooltip_title || '',
      check_type: ref.checkType || ref.check_type || 'none',
      code_list_name: ref.codeListName || ref.code_list_name || '',
      control_attr: ref.controlAttr || ref.control_attr || '',
      min_value: ref.minValue || ref.min_value || '',
      max_value: ref.maxValue || ref.max_value || '',
      string_length: ref.stringLength || ref.string_length || '',
      column_width: 0,
    };
  }
  if (itemType === 'component') {
    return {
      ...base,
      refCode: ref.code || ref.c_group_code,
      refName: ref.name || ref.c_group_name,
      childElements: (ref.elements || []).map(normalizeElement),
      childItems: ref.childItems || [],
      compColumns: ref.columns || 2,
    };
  }
  if (itemType === 'table') {
    return {
      ...base,
      refName: ref.name || ref.title || '数据列表',
      childElements: (ref.elements || ref.columns || []).map((el) =>
        ({ ...el, _id: (el._id || nextId++) })),
    };
  }
  if (itemType === 'section') {
    return {
      ...base,
      refName: ref.name || ref.title || '区块',
      collapsible: ref.collapsible !== false,
      childItems: (ref.items || []).map((it) => ({ ...it, _id: it._id || nextId++ })),
    };
  }
  if (itemType === 'tabGroup') {
    const tabId = nextId++;
    return {
      ...base,
      refName: ref.name || ref.refName || ref.title || '标签页',
      tabs: [{ _id: tabId, name: '标签1', childItems: [] }],
      activeTabId: tabId,
    };
  }
  return { ...base };
}

/** 标准化 snake_case 元件字段，补齐缺省值（组件 childElements 拖入时使用），确保 required_flag 等字段正确 */
function normalizeElement(el) {
  const defs = getDefaults(el.control_type || 'text');
  return {
    ...el,
    control_type: el.control_type || 'text',
    elem_code: el.elem_code || '',
    elem_name: el.elem_name || defs.label || el.control_type || 'text',
    elem_ename: el.elem_ename || '',
    rel_field_name: el.rel_field_name || '',
    rel_table_name: el.rel_table_name || '',
    required_flag: el.required_flag == null ? '0' : String(el.required_flag),
    readonly_flag: el.readonly_flag == null ? '0' : String(el.readonly_flag),
    visible_flag: el.visible_flag == null ? '1' : String(el.visible_flag),
    enabled_flag: el.enabled_flag == null ? '1' : String(el.enabled_flag),
    default_value: el.default_value || '',
    tooltip_title: el.tooltip_title || '',
    check_type: el.check_type || 'none',
    code_list_name: el.code_list_name || '',
    control_attr: el.control_attr || '',
  };
}

/** Recursively update an item (patch may be an object or `(item) => patch`). */
function updateInList(list, id, patch) {
  return list.map((item) => {
    if (item._id === id) {
      const p = typeof patch === 'function' ? patch(item) : patch;
      return { ...item, ...p };
    }
    let next = item;
    if (item.itemType === 'section' && item.childItems) {
      next = { ...next, childItems: updateInList(item.childItems, id, patch) };
    }
    if (item.itemType === 'component') {
      if (item.childItems) next = { ...next, childItems: updateInList(item.childItems, id, patch) };
      if (item.childElements) next = { ...next, childElements: patchElementList(item.childElements, id, patch) };
    }
    if (item.itemType === 'table' && item.childElements) {
      next = { ...next, childElements: patchElementList(item.childElements, id, patch) };
    }
    if (item.itemType === 'tabGroup' && item.tabs) {
      next = { ...next, tabs: item.tabs.map((t) => ({ ...t, childItems: updateInList(t.childItems || [], id, patch) })) };
    }
    return next;
  });
}

/** Patch an element inside a flat `childElements` list (elements are plain objects, no itemType). */
function patchElementList(list, id, patch) {
  return list.map((el) => {
    if (el._id === id) {
      const p = typeof patch === 'function' ? patch(el) : patch;
      return { ...el, ...p };
    }
    return el;
  });
}

/** Recursively remove an item by id (searches into childItems / childElements). */
function removeInList(list, id) {
  const result = [];
  for (const item of list) {
    if (item._id === id) continue;
    let next = item;
    if (item.itemType === 'section' && item.childItems) {
      next = { ...next, childItems: removeInList(item.childItems, id) };
    }
    if (item.itemType === 'component') {
      if (item.childItems) next = { ...next, childItems: removeInList(item.childItems, id) };
      if (item.childElements) next = { ...next, childElements: item.childElements.filter((el) => el._id !== id) };
    }
    if (item.itemType === 'table' && item.childElements) {
      next = { ...next, childElements: item.childElements.filter((el) => el._id !== id) };
    }
    if (item.itemType === 'tabGroup' && item.tabs) {
      next = { ...next, tabs: item.tabs.map((t) => ({ ...t, childItems: removeInList(t.childItems || [], id) })) };
    }
    result.push(next);
  }
  return result;
}

/** Recursively find an item by id (searches into childItems / childElements). */
function findInList(list, id) {
  for (const item of list) {
    if (item._id === id) return item;
    if (item.itemType === 'section' && item.childItems) {
      const found = findInList(item.childItems, id);
      if (found) return found;
    }
    if (item.itemType === 'component') {
      if (item.childItems) {
        const found = findInList(item.childItems, id);
        if (found) return found;
      }
      if (item.childElements) {
        const found = item.childElements.find((el) => el._id === id);
        if (found) return found;
      }
    }
    if (item.itemType === 'table' && item.childElements) {
      const found = item.childElements.find((el) => el._id === id);
      if (found) return found;
    }
    if (item.itemType === 'tabGroup' && item.tabs) {
      for (const t of item.tabs) {
        const found = findInList(t.childItems || [], id);
        if (found) return found;
      }
    }
  }
  return null;
}

/** Recursively assign fresh _ids when loading persisted canvas data. */
function hydrateItem(item) {
  const hydrated = { ...item, _id: nextId++, itemType: item.itemType || 'element' };
  if (hydrated.itemType === 'section') {
    hydrated.childItems = (item.childItems || []).map(hydrateItem);
  } else if (hydrated.itemType === 'component') {
    hydrated.childElements = (item.childElements || []).map((el) => ({ ...el, _id: nextId++ }));
    if (item.childItems) hydrated.childItems = item.childItems.map(hydrateItem);
  } else if (hydrated.itemType === 'table') {
    hydrated.childElements = (item.childElements || []).map((el) => ({ ...el, _id: nextId++ }));
  } else if (hydrated.itemType === 'tabGroup') {
    const oldActive = item.activeTabId;
    const oldTabs = item.tabs || [];
    let newActive = null;
    hydrated.tabs = oldTabs.map((t) => {
      const newId = nextId++;
      if (t._id === oldActive) newActive = newId;
      return { ...t, _id: newId, childItems: (t.childItems || []).map(hydrateItem) };
    });
    hydrated.activeTabId = newActive ?? hydrated.tabs[0]?._id ?? null;
  }
  return hydrated;
}

// Also export as usePageStore for clarity in new code
export { useCanvasStore as usePageStore };
