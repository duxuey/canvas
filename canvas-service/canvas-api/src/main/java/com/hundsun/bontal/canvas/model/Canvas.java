package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 画布定义表 (合并自 TB_PROD_REL_SCREEN / TB_PROD_TMPLT_REL_SCREEN / TB_PROD_PKG_SCREEN)
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_canvas")
public class Canvas extends BaseCommCodeTable.CommAuditColumn {

    /**
     * 主键
     */
    @TableId(value = "c_pk_id")
    private String c_pk_id;

    /**
     * 画布代码
     */
    @TableField(value = "c_canvas_code")
    private String c_canvas_code;

    /**
     * 画布中文名称
     */
    @TableField(value = "c_canvas_name")
    private String c_canvas_name;

    /**
     * 画布英文名称
     */
    @TableField(value = "c_canvas_ename")
    private String c_canvas_ename;

    /**
     * 画布类型: form/table/dashboard/custom
     */
    @TableField(value = "c_canvas_type")
    private String c_canvas_type;

    /**
     * 显示顺序
     */
    @TableField(value = "n_show_order")
    private Integer n_show_order;

    /**
     * 关联JS文件
     */
    @TableField(value = "c_rel_js_file")
    private String c_rel_js_file;

    /**
     * 画布JSON字符串
     */
    @TableField(value = "c_canvas_json")
    private String c_canvas_json;

    /**
     * 基础组件标志
     */
    @TableField(value = "c_base_flag")
    private String c_base_flag;

    /**
     * 系统代码 (多租户隔离)
     */
    @TableField(value = "c_system_code")
    private String c_system_code;

    /**
     * 页面代码
     */
    @TableField(value = "c_page_code")
    private String c_page_code;

    /**
     * 模板代码 (非空表示属于模板)
     */
    @TableField(value = "c_template_code")
    private String c_template_code;

    /**
     * 备注
     */
    @TableField(value = "c_remark")
    private String c_remark;

    /**
     * 更新时间（父类 CommAuditColumn 仅含创建时间，此处补充）
     */
    @TableField(value = "d_uptr_time")
    private java.util.Date d_uptr_time;
}
