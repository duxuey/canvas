package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 画布元素表 (合并自 TB_PROD_SCREEN_REL_ELEM / TB_PROD_TMPLT_SCREEN_ELEM / TB_PROD_PKG_SCREEN_ELEM)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_canvas_element")
public class CanvasElement extends BaseCommCodeTable.CommAuditColumn {

    @TableField(value = "c_pk_id")
    private String c_pk_id;

    @TableField(value = "c_canvas_code")
    private String c_canvas_code;

    @TableField(value = "c_elem_code")
    private String c_elem_code;

    @TableField(value = "c_control_type")
    private String c_control_type;

    @TableField(value = "c_check_type")
    private String c_check_type;

    @TableField(value = "c_required_flag")
    private String c_required_flag;

    @TableField(value = "c_readonly_flag")
    private String c_readonly_flag;

    @TableField(value = "c_visible_flag")
    private String c_visible_flag;

    @TableField(value = "c_default_value")
    private String c_default_value;

    @TableField(value = "c_enabled_flag")
    private String c_enabled_flag;

    @TableField(value = "c_min_value")
    private Integer c_min_value;

    @TableField(value = "c_max_value")
    private Integer c_max_value;

    @TableField(value = "c_precision")
    private Integer c_precision;

    @TableField(value = "c_code_list_name")
    private String c_code_list_name;

    @TableField(value = "n_string_length")
    private Integer n_string_length;

    @TableField(value = "c_click_event_func")
    private String c_click_event_func;

    @TableField(value = "c_comp_code")
    private String c_comp_code;

    @TableField(value = "n_elem_show_seq")
    private BigDecimal n_elem_show_seq;

    @TableField(value = "c_elem_name")
    private String c_elem_name;

    @TableField(value = "c_elem_ename")
    private String c_elem_ename;

    @TableField(value = "c_rel_field_name")
    private String c_rel_field_name;

    @TableField(value = "c_rel_table_name")
    private String c_rel_table_name;

    @TableField(value = "c_control_attr")
    private String c_control_attr;

    @TableField(value = "c_date_format")
    private String c_date_format;

    @TableField(value = "c_frontend_event")
    private String c_frontend_event;

    @TableField(value = "c_readonly_var")
    private String c_readonly_var;

    @TableField(value = "c_valid_control_attr")
    private String c_valid_control_attr;

    @TableField(value = "c_group_flag")
    private String c_group_flag;

    @TableField(value = "c_group_first_item")
    private String c_group_first_item;

    @TableField(value = "c_client_group")
    private String c_client_group;

    @TableField(value = "c_auto_select_first")
    private String c_auto_select_first;

    @TableField(value = "c_tooltip_title")
    private String c_tooltip_title;

    @TableField(value = "c_search_url")
    private String c_search_url;

    @TableField(value = "c_search_param_key")
    private String c_search_param_key;

    @TableField(value = "c_search_result_key")
    private String c_search_result_key;

    @TableField(value = "c_search_select_event")
    private String c_search_select_event;

    @TableField(value = "c_system_code")
    private String c_system_code;

    @TableField(value = "c_template_code")
    private String c_template_code;
}
