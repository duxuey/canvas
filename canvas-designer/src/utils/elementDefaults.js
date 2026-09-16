const DEFAULTS = {
  text:       { label: '文本输入', name: 'textInput', field: '', required: false },
  number:     { label: '数字输入', name: 'numInput', field: '', required: false },
  textarea:   { label: '文本域',   name: 'textArea', field: '', required: false },
  select:     { label: '下拉选择', name: 'select', field: '', required: false },
  datePicker: { label: '日期时间', name: 'datePicker', field: '', required: false },
  checkbox:   { label: '复选框',   name: 'checkbox', field: '', required: false },
  radio:      { label: '单选框',   name: 'radio', field: '', required: false },
  switch:     { label: '开关',     name: 'switch', field: '', required: false },
  file:       { label: '文件上传', name: 'fileUpload', field: '', required: false },
  label:      { label: '标签文字', name: 'label', field: '', required: false },
  divider:    { label: '分割线',   name: 'divider', field: '', required: false },
  button:     { label: '按钮',     name: 'button', field: '', required: false },
  groupFields:{ label: '字段组',   name: 'groupFields', field: '', required: false },
  search:     { label: '搜索框',   name: 'search', field: '', required: false },
  hidden:     { label: '隐藏域',   name: 'hidden', field: '', required: false },
};

export function getDefaults(controlType) {
  return DEFAULTS[controlType] || { label: controlType, name: '', field: '', required: false };
}
