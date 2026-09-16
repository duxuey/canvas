-- ============================================================
-- Canvas Management System - Database Schema
-- 画布管理系统 - 数据库初始化脚本
-- ============================================================

-- 1. 画布定义表 (合并 TB_PROD_REL_SCREEN / TB_PROD_TMPLT_REL_SCREEN / TB_PROD_PKG_SCREEN)
CREATE TABLE IF NOT EXISTS `tb_canvas` (
    `c_pk_id`           VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_canvas_code`     VARCHAR(32)   NOT NULL COMMENT '画布代码',
    `c_canvas_name`     VARCHAR(100)  DEFAULT NULL COMMENT '画布中文名称',
    `c_canvas_ename`    VARCHAR(100)  DEFAULT NULL COMMENT '画布英文名称',
    `c_canvas_type`     VARCHAR(32)   NOT NULL DEFAULT 'form' COMMENT '画布类型: form/table/dashboard/custom',
    `c_canvas_json`     MEDIUMTEXT    DEFAULT NULL COMMENT '画布JSON定义',
    `n_show_order`      INT(11)       DEFAULT 0 COMMENT '显示顺序',
    `c_rel_js_file`     VARCHAR(200)  DEFAULT NULL COMMENT '关联JS文件',
    `c_base_flag`       VARCHAR(1)    DEFAULT '0' COMMENT '基础组件标志',
    `c_system_code`     VARCHAR(64)   NOT NULL COMMENT '系统代码(多租户)',
    `c_page_code`       VARCHAR(128)  DEFAULT NULL COMMENT '页面代码',
    `c_template_code`   VARCHAR(32)   DEFAULT NULL COMMENT '所属模板代码(NULL=非模板画布)',
    `c_remark`          VARCHAR(500)  DEFAULT NULL COMMENT '备注',

    -- 审计列
    `c_crtr_code`       VARCHAR(32)   DEFAULT NULL COMMENT '创建人代码',
    `c_uptr_code`       VARCHAR(32)   DEFAULT NULL COMMENT '更新人代码',
    `d_crtr_time`       DATETIME      DEFAULT NULL COMMENT '创建时间',
    `d_uptr_time`       DATETIME      DEFAULT NULL COMMENT '更新时间',

    PRIMARY KEY (`c_pk_id`),
    UNIQUE KEY `uk_canvas_code` (`c_canvas_code`),
    KEY `idx_system_page` (`c_system_code`, `c_page_code`),
    KEY `idx_template_code` (`c_template_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布定义表';


-- 2. 画布元素表 (合并 TB_PROD_SCREEN_REL_ELEM / TB_PROD_TMPLT_SCREEN_ELEM / TB_PROD_PKG_SCREEN_ELEM)
CREATE TABLE IF NOT EXISTS `tb_canvas_element` (
    `c_pk_id`               VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_canvas_code`         VARCHAR(32)   NOT NULL COMMENT '画布代码',
    `c_elem_code`           VARCHAR(32)   DEFAULT NULL COMMENT '元件代码',
    `c_elem_name`           VARCHAR(100)  DEFAULT NULL COMMENT '元件中文名称',
    `c_elem_ename`          VARCHAR(100)  DEFAULT NULL COMMENT '元件英文名称',
    `c_control_type`        VARCHAR(32)   DEFAULT NULL COMMENT '控件类型: text/number/select/date/button/groupFields/picture/moreinfos',
    `c_check_type`          VARCHAR(32)   DEFAULT NULL COMMENT '校验类型',
    `c_required_flag`       VARCHAR(1)    DEFAULT '0' COMMENT '必输标志: 0=否,1=是',
    `c_readonly_flag`       VARCHAR(1)    DEFAULT '0' COMMENT '只读标志: 0=否,1=是',
    `c_visible_flag`        VARCHAR(1)    DEFAULT '1' COMMENT '显示标志: 0=隐藏,1=显示',
    `c_default_value`       VARCHAR(500)  DEFAULT NULL COMMENT '缺省值',
    `c_enabled_flag`        VARCHAR(1)    DEFAULT '1' COMMENT '启用标志',
    `c_min_value`           INT(11)       DEFAULT NULL COMMENT '最小值',
    `c_max_value`           INT(11)       DEFAULT NULL COMMENT '最大值',
    `c_precision`           INT(11)       DEFAULT NULL COMMENT '数据精度',
    `c_code_list_name`      VARCHAR(100)  DEFAULT NULL COMMENT '下拉列表名称',
    `n_string_length`       INT(11)       DEFAULT NULL COMMENT '字符串长度',
    `c_click_event_func`    VARCHAR(100)  DEFAULT NULL COMMENT '单击事件方法',
    `c_comp_code`           VARCHAR(64)   DEFAULT NULL COMMENT '组件代码',
    `n_elem_show_seq`       DECIMAL(10,2) DEFAULT 0.00 COMMENT '元素显示顺序',
    `c_rel_field_name`      VARCHAR(64)   DEFAULT NULL COMMENT '关联字段名',
    `c_rel_table_name`      VARCHAR(64)   DEFAULT NULL COMMENT '关联表名',
    `c_control_attr`        VARCHAR(500)  DEFAULT NULL COMMENT '控件属性JSON',
    `c_date_format`         VARCHAR(64)   DEFAULT NULL COMMENT '日期格式',
    `c_frontend_event`      TEXT          DEFAULT NULL COMMENT '前端事件JSON',
    `c_readonly_var`        VARCHAR(100)  DEFAULT NULL COMMENT '只读变量',
    `c_valid_control_attr`  VARCHAR(500)  DEFAULT NULL COMMENT '校验控件属性',
    `c_group_flag`          VARCHAR(1)    DEFAULT '0' COMMENT '合并字段标志',
    `c_group_first_item`    VARCHAR(32)   DEFAULT NULL COMMENT '合并的首个字段',
    `c_client_group`        VARCHAR(32)   DEFAULT NULL COMMENT '栏目分组',
    `c_auto_select_first`   VARCHAR(1)    DEFAULT '0' COMMENT '默认下拉首值',
    `c_tooltip_title`       VARCHAR(200)  DEFAULT NULL COMMENT '浮标内容',
    `c_search_url`          VARCHAR(500)  DEFAULT NULL COMMENT '搜索框请求地址',
    `c_search_param_key`    VARCHAR(100)  DEFAULT NULL COMMENT '搜索框请求列表key',
    `c_search_result_key`   VARCHAR(100)  DEFAULT NULL COMMENT '搜索框结果列表key',
    `c_search_select_event` VARCHAR(100)  DEFAULT NULL COMMENT '搜索框选中事件',
    `c_system_code`         VARCHAR(64)   NOT NULL COMMENT '系统代码(多租户)',
    `c_template_code`       VARCHAR(32)   DEFAULT NULL COMMENT '所属模板代码',

    -- 审计列
    `c_crtr_code`           VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`           VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`           DATETIME      DEFAULT NULL,
    `d_uptr_time`           DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    KEY `idx_canvas_code` (`c_canvas_code`),
    KEY `idx_elem_code` (`c_elem_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布元素表';


-- 3. 画布配置表 (合并 TB_PROD_SCREEN_PROP / TB_PROD_TMPLT_SCREEN_PROP / TB_PROD_PKG_SCREEN_PROP)
CREATE TABLE IF NOT EXISTS `tb_canvas_config` (
    `c_pk_id`               VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_canvas_code`         VARCHAR(32)   NOT NULL COMMENT '画布代码',
    `c_canvas_name`         VARCHAR(100)  DEFAULT NULL COMMENT '画布中文名称',
    `c_canvas_ename`        VARCHAR(100)  DEFAULT NULL COMMENT '画布英文名称',
    `c_canvas_type`         VARCHAR(32)   DEFAULT NULL COMMENT '画布类型: form/table',
    `n_columns`             INT(11)       DEFAULT 1 COMMENT '列数',
    `c_buttons_layout`      VARCHAR(64)   DEFAULT NULL COMMENT '按钮位置',
    `c_modify_func`         VARCHAR(100)  DEFAULT NULL COMMENT '修改事件方法',
    `c_calc_envelop_func`   VARCHAR(100)  DEFAULT NULL COMMENT '计算封装方法',
    `c_save_envelop_func`   VARCHAR(100)  DEFAULT NULL COMMENT '保存封装方法',
    `c_query_envelop_func`  VARCHAR(100)  DEFAULT NULL COMMENT '查询封装方法',
    `c_add_event_func`      VARCHAR(100)  DEFAULT NULL COMMENT '新增事件方法',
    `c_delete_event_func`   VARCHAR(100)  DEFAULT NULL COMMENT '删除事件方法',
    `c_create_event_func`   VARCHAR(100)  DEFAULT NULL COMMENT '初始化事件方法',
    `c_verify_valid_func`   VARCHAR(100)  DEFAULT NULL COMMENT '校验方法',
    `c_add_control_attr`    VARCHAR(500)  DEFAULT NULL COMMENT '新增按钮属性JSON',
    `c_delete_control_attr` VARCHAR(500)  DEFAULT NULL COMMENT '删除按钮属性JSON',
    `c_oprt_type`           TEXT          DEFAULT NULL COMMENT '操作类型JSON',
    `c_oprt_button`         VARCHAR(500)  DEFAULT NULL COMMENT '操作按钮',
    `c_comp_flag`           VARCHAR(32)   DEFAULT NULL COMMENT '组件标志',
    `c_sql_searchsql`       TEXT          DEFAULT NULL COMMENT '查询SQL',
    `c_sql_insertsql`       TEXT          DEFAULT NULL COMMENT '插入SQL',
    `c_table_default_info`  TEXT          DEFAULT NULL COMMENT '表格默认数据JSON',
    `c_system_code`         VARCHAR(64)   NOT NULL COMMENT '系统代码(多租户)',
    `c_template_code`       VARCHAR(32)   DEFAULT NULL COMMENT '所属模板代码',

    -- 审计列
    `c_crtr_code`           VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`           VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`           DATETIME      DEFAULT NULL,
    `d_uptr_time`           DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    UNIQUE KEY `uk_canvas_code` (`c_canvas_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布配置表';


-- 4. 画布按钮表 (简化自 TB_PROD_SCREEN_BUTTON / TB_PROD_TMPLT_SCREEN_BUTTON)
CREATE TABLE IF NOT EXISTS `tb_canvas_button` (
    `c_pk_id`           VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_button_code`     VARCHAR(32)   NOT NULL COMMENT '按钮代码',
    `c_canvas_code`     VARCHAR(32)   NOT NULL COMMENT '画布代码',
    `c_button_name`     VARCHAR(100)  DEFAULT NULL COMMENT '中文名称',
    `c_button_ename`    VARCHAR(100)  DEFAULT NULL COMMENT '英文名称',
    `c_button_type`     VARCHAR(32)   DEFAULT NULL COMMENT '按钮类型',
    `c_event_name`      VARCHAR(100)  DEFAULT NULL COMMENT '事件名称',
    `n_show_order`      INT(11)       DEFAULT 0 COMMENT '显示顺序',
    `c_system_code`     VARCHAR(64)   NOT NULL COMMENT '系统代码',

    -- 审计列
    `c_crtr_code`       VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`       VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`       DATETIME      DEFAULT NULL,
    `d_uptr_time`       DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    KEY `idx_canvas_code` (`c_canvas_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布按钮表';


-- 5. 页面模板表 (简化自 TB_PROD_TEMPLATE)
CREATE TABLE IF NOT EXISTS `tb_page_template` (
    `c_pk_id`           VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_template_code`   VARCHAR(32)   NOT NULL COMMENT '模板代码',
    `c_template_name`   VARCHAR(100)  DEFAULT NULL COMMENT '模板名称',
    `c_template_desc`   VARCHAR(500)  DEFAULT NULL COMMENT '模板描述',
    `c_template_type`   VARCHAR(32)   DEFAULT NULL COMMENT '模板类型',
    `c_del_flag`        VARCHAR(1)    DEFAULT '0' COMMENT '删除标志',
    `c_system_code`     VARCHAR(64)   NOT NULL COMMENT '系统代码',

    -- 审计列
    `c_crtr_code`       VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`       VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`       DATETIME      DEFAULT NULL,
    `d_uptr_time`       DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    UNIQUE KEY `uk_template_code` (`c_template_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面模板表';


-- 6. 元素分组表 (简化自 TB_PROD_DATA_VIEW / TB_PROD_TMPLT_DATA_VIEW)
CREATE TABLE IF NOT EXISTS `tb_element_group` (
    `c_pk_id`           VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_group_code`      VARCHAR(32)   NOT NULL COMMENT '分组代码',
    `c_group_name`      VARCHAR(100)  DEFAULT NULL COMMENT '分组名称',
    `c_group_desc`      VARCHAR(500)  DEFAULT NULL COMMENT '分组描述',
    `c_group_type`      VARCHAR(32)   DEFAULT NULL COMMENT '分组类型',
    `c_group_tag`       VARCHAR(32)   DEFAULT NULL COMMENT '分组标签',
    `c_system_code`     VARCHAR(64)   NOT NULL COMMENT '系统代码',

    -- 审计列
    `c_crtr_code`       VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`       VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`       DATETIME      DEFAULT NULL,
    `d_uptr_time`       DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    UNIQUE KEY `uk_group_code` (`c_group_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='元素分组表';


-- 7. 元素分组明细表 (简化自 TB_PROD_VIEW_ELEM / TB_PROD_TMPLT_VIEW_ELEM)
CREATE TABLE IF NOT EXISTS `tb_element_group_item` (
    `c_pk_id`           VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_group_code`      VARCHAR(32)   NOT NULL COMMENT '分组代码',
    `c_element_code`    VARCHAR(32)   NOT NULL COMMENT '元件代码',
    `c_canvas_code`     VARCHAR(32)   NOT NULL COMMENT '画布代码',
    `c_system_code`     VARCHAR(64)   NOT NULL COMMENT '系统代码',

    -- 审计列
    `c_crtr_code`       VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`       VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`       DATETIME      DEFAULT NULL,
    `d_uptr_time`       DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    KEY `idx_group_code` (`c_group_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='元素分组明细表';


-- 8. 画布发布记录表
CREATE TABLE IF NOT EXISTS `tb_canvas_publish` (
    `c_pk_id`           VARCHAR(32)   NOT NULL COMMENT '主键ID',
    `c_canvas_code`     VARCHAR(32)   NOT NULL COMMENT '画布代码',
    `n_version`         INT(11)       NOT NULL COMMENT '版本号(1,2,3...)',
    `c_version_name`    VARCHAR(100)  DEFAULT NULL COMMENT '版本名称(可选标签)',
    `c_publish_json`    MEDIUMTEXT    NOT NULL COMMENT '发布的JSON内容',
    `c_publish_note`    VARCHAR(500)  DEFAULT NULL COMMENT '发布备注/变更说明',
    `c_status`          VARCHAR(32)   DEFAULT 'published' COMMENT '状态: published/deprecated',
    `c_system_code`     VARCHAR(64)   NOT NULL COMMENT '系统代码(多租户)',

    -- 审计列
    `c_crtr_code`       VARCHAR(32)   DEFAULT NULL,
    `c_uptr_code`       VARCHAR(32)   DEFAULT NULL,
    `d_crtr_time`       DATETIME      DEFAULT NULL,
    `d_uptr_time`       DATETIME      DEFAULT NULL,

    PRIMARY KEY (`c_pk_id`),
    KEY `idx_canvas_code` (`c_canvas_code`),
    KEY `idx_system_code` (`c_system_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布发布记录表';
