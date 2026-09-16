package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 画布配置表 (合并自 TB_PROD_SCREEN_PROP / TB_PROD_TMPLT_SCREEN_PROP / TB_PROD_PKG_SCREEN_PROP)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_canvas_config")
public class CanvasConfig extends BaseCommCodeTable.CommAuditColumn {

    @TableId(value = "c_pk_id")
    private String c_pk_id;

    @TableField(value = "c_canvas_code")
    private String c_canvas_code;

    @TableField(value = "c_canvas_name")
    private String c_canvas_name;

    @TableField(value = "c_canvas_ename")
    private String c_canvas_ename;

    @TableField(value = "c_canvas_type")
    private String c_canvas_type;

    @TableField(value = "n_columns")
    private Integer n_columns;

    @TableField(value = "c_buttons_layout")
    private String c_buttons_layout;

    @TableField(value = "c_modify_func")
    private String c_modify_func;

    @TableField(value = "c_calc_envelop_func")
    private String c_calc_envelop_func;

    @TableField(value = "c_save_envelop_func")
    private String c_save_envelop_func;

    @TableField(value = "c_query_envelop_func")
    private String c_query_envelop_func;

    @TableField(value = "c_add_event_func")
    private String c_add_event_func;

    @TableField(value = "c_delete_event_func")
    private String c_delete_event_func;

    @TableField(value = "c_create_event_func")
    private String c_create_event_func;

    @TableField(value = "c_verify_valid_func")
    private String c_verify_valid_func;

    @TableField(value = "c_add_control_attr")
    private String c_add_control_attr;

    @TableField(value = "c_delete_control_attr")
    private String c_delete_control_attr;

    @TableField(value = "c_oprt_type")
    private String c_oprt_type;

    @TableField(value = "c_oprt_button")
    private String c_oprt_button;

    @TableField(value = "c_comp_flag")
    private String c_comp_flag;

    @TableField(value = "c_sql_searchsql")
    private String c_sql_searchsql;

    @TableField(value = "c_sql_insertsql")
    private String c_sql_insertsql;

    @TableField(value = "c_table_default_info")
    private String c_table_default_info;

    @TableField(value = "c_system_code")
    private String c_system_code;

    @TableField(value = "c_template_code")
    private String c_template_code;
}
