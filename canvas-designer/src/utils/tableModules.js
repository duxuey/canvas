/**
 * 关联表名 -> 中文业务模块名 映射
 * 用于设计器侧边栏「元件定义」按业务模块分组展示。
 *
 * 数据来源：产品工厂 fpic_prod_db 中 tb_prod_rel_screen.c_screen_cname（画面/模块名）
 * 与 tb_prod_screen_rel_elem.c_rel_table_name 的对应关系。
 * 注：同一张表可能被多个模块共用（如 tb_udr_plcy_cvrg），此处取最常出现的模块名，
 * 或用更中性的统称，保证分组大致合理即可。
 */
export const TABLE_TO_MODULE = {
  // 主数据 / 客户类
  tb_udr_plcy_main: '基本信息',
  tb_udr_plcy_applnt: '投保人信息',
  tb_udr_plcy_insrnt: '被保险人信息',
  tb_udr_plcy_bnf: '受益人信息',
  tb_udr_plcy_benefit_owner: '受益所有人',
  tb_udr_plcy_agent: '授权经办人信息',
  tb_udr_plcy_rel_enterp: '关联投保人',
  tb_udr_plcy_borrower: '借款人信息',
  tb_udr_plcy_empl: '雇员清单',

  // 险别 / 责任类
  tb_udr_plcy_cvrg: '险别 / 责任信息',
  tb_udr_plcy_cvrg_lmt_info: '险别限额信息',
  tb_udr_plcy_clm_lmt_info: '限额信息',
  tb_udr_plcy_duty: '责任信息',
  tb_udr_plcy_deduct_info: '免赔信息',
  tb_udr_plcy_deduc_info: '免赔信息',
  tb_udr_plcy_dduct_info: '免赔信息',

  // 标的信息（多险种共用）
  tb_udr_plcy_tgt_duty: '标的信息',
  tb_udr_plcy_tgt_cargo: '标的信息',
  tb_udr_plcy_tgt_ship: '标的信息',
  tb_udr_plcy_tgt_ent: '标的信息',
  tb_udr_plcy_tgt_project: '标的信息',
  tb_udr_plcy_tgt_acci: '标的信息',
  tb_udr_plcy_tgt_credit: '标的信息',
  tb_udr_plcy_tgt_enge: '标的信息',
  tb_udr_plcy_tgt_accident: '标的信息',

  // 方案 / 缴费 / 费用
  tb_udr_plcy_plan: '方案信息',
  tb_udr_plcy_payplan: '缴费计划',
  tb_udr_plcy_fee: '费用信息',
  tb_udr_plcy_inv_puhr: '发票信息',

  // 地址 / 渠道 / 销售
  tb_udr_plcy_address: '地址信息',
  tb_udr_plcy_chnl: '渠道信息',
  tb_udr_plcy_sales: '销售信息',
  tb_udr_plcy_share_dept: '配送信息',
  tb_udr_plcy_spec: '特别约定',
  tb_udr_plcy_explanation: '出单备注',

  // 车辆 / 财产 / 设备
  tb_udr_plcy_car_info: '车辆信息',
  tb_udr_plcy_equipment_list: '设备信息',
  tb_udr_plcy_lift_list: '电梯信息清单',
  tb_udr_plcy_construct_list: '施工机具清单信息',
  tb_udr_plcy_container_info: '集装箱箱体明细',
  tb_udr_plcy_conveyance_info: '运输信息',
  tb_udr_plcy_cover: '保单承保内容',

  // 清单类
  tb_udr_plcy_prod_list: '产品清单',
  tb_udr_plcy_agency_list: '经销商清单',
  tb_udr_plcy_student_list: '学生清单',
  tb_udr_plcy_work_list: '工种列表',
  tb_udr_plcy_senior_executive_list: '董监事高管清单',
  tb_udr_plcy_medical_care_list: '医护人员清单',

  // 其他
  tb_udr_plcy_business_details: '商户信息',
  tb_udr_plcy_service: '被保人服务',
  tb_udr_plcy_storage_address: '保单内容附件清单',
  tb_udr_plcy_order_details: '订单信息',
  tb_udr_plcy_pml: 'PML 信息',
  tb_udr_plcy_complication_payout: '医疗意外并发症给付',
  tb_udr_plcy_enge_related: '工程关联方信息',
};

/** 未匹配到映射时的兜底分组名 */
export const UNKNOWN_MODULE = '未分类';

/** 按钮专用分组名（按钮无 rel_table_name，不参与业务模块分组） */
export const BUTTON_MODULE = '按钮';

/**
 * 按元件定义所属模块分组（返回 [模块名, def[]][]）。
 * button 类元件单独归入「按钮」组，其余按关联表 -> 业务模块名分组。
 */
export function groupDefsByModule(defs) {
  const groups = new Map();
  for (const def of defs) {
    const module = (def.control_type === 'button')
      ? BUTTON_MODULE
      : ((def.rel_table_name && TABLE_TO_MODULE[def.rel_table_name]) || UNKNOWN_MODULE);
    if (!groups.has(module)) groups.set(module, []);
    groups.get(module).push(def);
  }
  // 排序：按钮组最前，其次按元件数量降序，未分类最后
  const entries = [...groups.entries()];
  entries.sort((a, b) => {
    if (a[0] === BUTTON_MODULE) return -1;
    if (b[0] === BUTTON_MODULE) return 1;
    if (a[0] === UNKNOWN_MODULE) return 1;
    if (b[0] === UNKNOWN_MODULE) return -1;
    return b[1].length - a[1].length;
  });
  return entries;
}
