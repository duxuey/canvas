package com.hundsun.bontal.canvas.model;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.hundsun.bontal.common.model.BaseCommCodeTable;

/**
 * 画布发布记录表
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "tb_canvas_publish")
public class CanvasPublish extends BaseCommCodeTable.AuditColumn {

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
     * 版本号 (1, 2, 3...)
     */
    @TableField(value = "n_version")
    private Integer n_version;

    /**
     * 版本名称 (可选标签)
     */
    @TableField(value = "c_version_name")
    private String c_version_name;

    /**
     * 发布的JSON内容
     */
    @TableField(value = "c_publish_json")
    private String c_publish_json;

    /**
     * 发布备注 / 变更说明
     */
    @TableField(value = "c_publish_note")
    private String c_publish_note;

    /**
     * 状态: published / deprecated
     */
    @TableField(value = "c_status")
    private String c_status;

    /**
     * 系统代码 (多租户隔离)
     */
    @TableField(value = "c_system_code")
    private String c_system_code;
}
