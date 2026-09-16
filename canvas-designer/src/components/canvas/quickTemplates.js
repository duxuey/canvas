/**
 * Shared quick templates — used by both CanvasArea & Header toolbars.
 */
export const TEMPLATES = {
  userAdd: {
    name: '用户新增表单',
    columns: 2,
    fields: [
      { ct: 'text',       name: '用户名',   code: 'username',     req: '1', ph: '请输入登录用户名', field: 'user_name' },
      { ct: 'text',       name: '姓名',     code: 'realname',     req: '1', ph: '请输入真实姓名',   field: 'real_name' },
      { ct: 'text',       name: '手机号',   code: 'mobile',       req: '1', ph: '请输入手机号',     field: 'mobile' },
      { ct: 'text',       name: '邮箱',     code: 'email',        req: '0', ph: '请输入邮箱地址',   field: 'email' },
      { ct: 'text',       name: '密码',     code: 'password',     req: '1', ph: '请输入密码',       field: 'password' },
      { ct: 'text',       name: '确认密码', code: 'confirmPwd',   req: '1', ph: '请再次输入密码',   field: 'confirm_pwd' },
      { ct: 'select',     name: '角色',     code: 'role',         req: '1', ph: '请选择角色',       field: 'role_code' },
      { ct: 'datePicker', name: '生日',     code: 'birthday',     req: '0', ph: '',                 field: 'birthday' },
      { ct: 'textarea',   name: '备注',     code: 'remark',       req: '0', ph: '请输入备注信息',   field: 'remark' },
      { ct: 'switch',     name: '启用状态', code: 'status',       req: '0', ph: '',                 field: 'enabled_flag' },
    ],
  },
  userEdit: {
    name: '用户编辑表单',
    columns: 2,
    fields: [
      { ct: 'text',       name: '用户名',   code: 'username',     req: '1', ph: '请输入登录用户名', field: 'user_name' },
      { ct: 'text',       name: '姓名',     code: 'realname',     req: '1', ph: '请输入真实姓名',   field: 'real_name' },
      { ct: 'text',       name: '手机号',   code: 'mobile',       req: '1', ph: '请输入手机号',     field: 'mobile' },
      { ct: 'text',       name: '邮箱',     code: 'email',        req: '0', ph: '请输入邮箱地址',   field: 'email' },
      { ct: 'select',     name: '角色',     code: 'role',         req: '1', ph: '请选择角色',       field: 'role_code' },
      { ct: 'datePicker', name: '生日',     code: 'birthday',     req: '0', ph: '',                 field: 'birthday' },
      { ct: 'switch',     name: '启用状态', code: 'status',       req: '0', ph: '',                 field: 'enabled_flag' },
      { ct: 'textarea',   name: '备注',     code: 'remark',       req: '0', ph: '请输入备注信息',   field: 'remark' },
    ],
  },
  searchBox: {
    name: '搜索区域',
    columns: 4,
    fields: [
      { ct: 'text',       name: '用户名',   code: 's_username',   req: '0', ph: '请输入用户名',     field: 'user_name' },
      { ct: 'text',       name: '姓名',     code: 's_realname',   req: '0', ph: '请输入姓名',       field: 'real_name' },
      { ct: 'select',     name: '角色',     code: 's_role',       req: '0', ph: '请选择角色',       field: 'role_code' },
      { ct: 'datePicker', name: '创建日期', code: 's_date',       req: '0', ph: '',                 field: 'create_date' },
      { ct: 'button',     name: '查询',     code: 'btn_search',   req: '0', ph: '',                 field: '' },
      { ct: 'button',     name: '重置',     code: 'btn_reset',    req: '0', ph: '',                 field: '' },
    ],
  },
};

export function loadTemplate(store, ui, templateKey, defaultCols) {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) return;

  // Remember current system/page before reset
  const { systemCode, pageCode, templateCode } = store;

  if (!store.isCurrentPristine()) store.newTab();
  store.reset();
  store.setMeta({ canvasName: tpl.name, canvasType: 'form', systemCode, pageCode, templateCode });

  const cols = tpl.columns || defaultCols || 2;
  if (tpl.columns) store.setColumns(tpl.columns);

  tpl.fields.forEach((f, idx) => {
    const ri = Math.floor(idx / cols);
    const ci = idx % cols;
    store.addItem('element', {
      controlType: f.ct,
      name: f.name,
      code: f.code,
      fieldName: f.field,
      placeholder: f.ph,
      required: f.req === '1',
    }, ri, ci);
  });

  if (ui && ui.addToast) {
    ui.addToast('已加载模板: ' + tpl.name, 'success');
  }
}
