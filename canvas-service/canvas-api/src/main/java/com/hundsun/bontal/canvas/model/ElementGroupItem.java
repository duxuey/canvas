package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 元素分组明细表 (简化自 TB_PROD_VIEW_ELEM / TB_PROD_TMPLT_VIEW_ELEM)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_element_group_item")
public class ElementGroupItem extends BaseCommCodeTable.CommAuditColumn {

    @TableId(value = "c_pk_id")
    private String c_pk_id;

    @TableField(value = "c_group_code")
    private String c_group_code;

    @TableField(value = "c_element_code")
    private String c_element_code;

    @TableField(value = "c_canvas_code")
    private String c_canvas_code;

    @TableField(value = "c_system_code")
    private String c_system_code;
}
