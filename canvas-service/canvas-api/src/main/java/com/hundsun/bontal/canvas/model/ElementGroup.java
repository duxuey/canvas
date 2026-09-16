package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 元素分组表 (简化自 TB_PROD_DATA_VIEW / TB_PROD_TMPLT_DATA_VIEW)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_element_group")
public class ElementGroup extends BaseCommCodeTable.CommAuditColumn {

    @TableId(value = "c_pk_id")
    private String c_pk_id;

    @TableField(value = "c_group_code")
    private String c_group_code;

    @TableField(value = "c_group_name")
    private String c_group_name;

    @TableField(value = "c_group_desc")
    private String c_group_desc;

    @TableField(value = "c_group_type")
    private String c_group_type;

    @TableField(value = "c_group_tag")
    private String c_group_tag;

    @TableField(value = "c_system_code")
    private String c_system_code;

    @TableField(value = "c_elements_json")
    private String c_elements_json;
}
