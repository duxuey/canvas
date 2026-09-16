package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 画布按钮表 (简化自 TB_PROD_SCREEN_BUTTON / TB_PROD_TMPLT_SCREEN_BUTTON)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_canvas_button")
public class CanvasButton extends BaseCommCodeTable.CommAuditColumn {

    @TableId(value = "c_pk_id")
    private String c_pk_id;

    @TableField(value = "c_button_code")
    private String c_button_code;

    @TableField(value = "c_canvas_code")
    private String c_canvas_code;

    @TableField(value = "c_button_name")
    private String c_button_name;

    @TableField(value = "c_button_ename")
    private String c_button_ename;

    @TableField(value = "c_button_type")
    private String c_button_type;

    @TableField(value = "c_event_name")
    private String c_event_name;

    @TableField(value = "n_show_order")
    private Integer n_show_order;

    @TableField(value = "c_system_code")
    private String c_system_code;
}
