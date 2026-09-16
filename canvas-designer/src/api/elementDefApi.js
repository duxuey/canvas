import { apiPost } from './client';

// Convert frontend snake_case keys to backend camelCase keys
const toSaveInput = (input) => ({
  elemCode: input.elem_code,
  elemName: input.elem_name,
  elemEname: input.elem_ename,
  controlType: input.control_type,
  relTableName: input.rel_table_name,
  relFieldName: input.rel_field_name,
  dataType: input.data_type,
  defaultValue: input.default_value,
  placeholder: input.placeholder,
  tooltipTitle: input.tooltip_title,
  requiredFlag: input.required_flag,
  checkType: input.check_type,
  minValue: input.min_value,
  maxValue: input.max_value,
  stringLength: input.string_length,
  codeListName: input.code_list_name,
  controlAttr: input.control_attr,
  systemCode: input.systemCode,
});

export const elementDefApi = {
  save: (input) => apiPost('/element_def/save', toSaveInput(input)),
  delete: (code, systemCode) => apiPost('/element_def/delete', { code, systemCode }),
  queryByCode: (code) => apiPost('/element_def/query_by_code', { code }),
  queryBySystem: (systemCode) => apiPost('/element_def/query_by_system', { systemCode }),
  queryByControlType: (systemCode, controlType) =>
    apiPost('/element_def/query_by_type', { systemCode, controlType }),
};
