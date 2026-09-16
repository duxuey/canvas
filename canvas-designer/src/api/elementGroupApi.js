import { apiPost } from './client';

const toSaveInput = (input) => ({
  groupCode: input.c_group_code || input.groupCode || input.code,
  groupName: input.c_group_name || input.groupName || input.name,
  groupDesc: input.c_group_desc || input.groupDesc || input.desc,
  groupType: input.c_group_type || input.groupType || input.type,
  groupTag: input.c_group_tag || input.groupTag || input.tag,
  systemCode: input.systemCode,
  columns: input.columns,
  elements: (input.elements || []).map((el) => ({
    elem_code: el.elem_code,
    control_type: el.control_type,
    elem_name: el.elem_name,
    rel_field_name: el.rel_field_name,
    rel_table_name: el.rel_table_name,
    required_flag: el.required_flag,
    placeholder: el.placeholder,
    _rowIdx: el._rowIdx,
    _colIdx: el._colIdx,
  })),
});

export const elementGroupApi = {
  save: (input) => apiPost('/element_group/save', toSaveInput(input)),
  delete: (groupCode) => apiPost('/element_group/delete', { groupCode }),
  queryBySystem: (systemCode) => apiPost('/element_group/query_by_system', { systemCode }),
  addItem: (input) => apiPost('/element_group/add_item', input),
  deleteItem: (groupCode, elemCode) => apiPost('/element_group/delete_item', { groupCode, elemCode }),
  queryItems: (groupCode) => apiPost('/element_group/query_items', { groupCode }),
};
