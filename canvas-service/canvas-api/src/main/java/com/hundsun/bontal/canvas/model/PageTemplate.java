package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 页面模板表 (简化自 TB_PROD_TEMPLATE)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_page_template")
public class PageTemplate extends BaseCommCodeTable.CommAuditColumn {

    @TableId(value = "c_pk_id")
    private String c_pk_id;

    @TableField(value = "c_template_code")
    private String c_template_code;

    @TableField(value = "c_template_name")
    private String c_template_name;

    @TableField(value = "c_template_desc")
    private String c_template_desc;

    @TableField(value = "c_template_type")
    private String c_template_type;

    @TableField(value = "c_del_flag")
    private String c_del_flag;

    @TableField(value = "c_system_code")
    private String c_system_code;
}
