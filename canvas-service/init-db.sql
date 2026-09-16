-- =====================================================
-- canvas-service 数据库初始化脚本
-- =====================================================

DROP DATABASE IF EXISTS core_db;

CREATE DATABASE IF NOT EXISTS core_db
  DEFAULT CHARACTER SET utf8
  DEFAULT COLLATE utf8_general_ci;

USE core_db;

-- 1. 画布定义表
CREATE TABLE IF NOT EXISTS tb_canvas (
    c_pk_id         VARCHAR(64)  NOT NULL COMMENT '主键',
    c_canvas_code   VARCHAR(128) NOT NULL COMMENT '画布代码',
    c_canvas_name   VARCHAR(256) DEFAULT NULL COMMENT '画布中文名称',
    c_canvas_ename  VARCHAR(256) DEFAULT NULL COMMENT '画布英文名称',
    c_canvas_type   VARCHAR(32)  DEFAULT NULL COMMENT '画布类型: form/table/dashboard/custom',
    n_show_order    INT          DEFAULT 0  COMMENT '显示顺序',
    c_rel_js_file   VARCHAR(512) DEFAULT NULL COMMENT '关联JS文件',
    c_canvas_json   LONGTEXT     DEFAULT NULL COMMENT '画布JSON字符串',
    c_base_flag     VARCHAR(8)   DEFAULT NULL COMMENT '基础组件标志',
    c_system_code   VARCHAR(64)  DEFAULT NULL COMMENT '系统代码(多租户隔离)',
    c_page_code     VARCHAR(128) DEFAULT NULL COMMENT '页面代码',
    c_template_code VARCHAR(128) DEFAULT NULL COMMENT '模板代码',
    c_remark        VARCHAR(512) DEFAULT NULL COMMENT '备注',
    create_by       VARCHAR(64)  DEFAULT NULL COMMENT '创建人',
    create_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    UNIQUE KEY uk_canvas_code (c_canvas_code),
    KEY idx_sys_page (c_system_code, c_page_code),
    KEY idx_template (c_template_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='画布定义表';

-- 2. 画布配置表
CREATE TABLE IF NOT EXISTS tb_canvas_config (
    c_pk_id               VARCHAR(64)  NOT NULL COMMENT '主键',
    c_canvas_code          VARCHAR(128) DEFAULT NULL COMMENT '画布代码',
    c_canvas_name          VARCHAR(256) DEFAULT NULL COMMENT '画布中文名称',
    c_canvas_ename         VARCHAR(256) DEFAULT NULL COMMENT '画布英文名称',
    c_canvas_type          VARCHAR(32)  DEFAULT NULL COMMENT '画布类型',
    n_columns              INT          DEFAULT 1  COMMENT '列数',
    c_buttons_layout       VARCHAR(32)  DEFAULT NULL COMMENT '按钮布局',
    c_modify_func          VARCHAR(128) DEFAULT NULL COMMENT '修改方法名',
    c_calc_envelop_func    VARCHAR(128) DEFAULT NULL COMMENT '计算包装方法名',
    c_save_envelop_func    VARCHAR(128) DEFAULT NULL COMMENT '保存包装方法名',
    c_query_envelop_func   VARCHAR(128) DEFAULT NULL COMMENT '查询包装方法名',
    c_add_event_func       VARCHAR(128) DEFAULT NULL COMMENT '添加事件方法名',
    c_delete_event_func    VARCHAR(128) DEFAULT NULL COMMENT '删除事件方法名',
    c_create_event_func    VARCHAR(128) DEFAULT NULL COMMENT '创建事件方法名',
    c_verify_valid_func    VARCHAR(128) DEFAULT NULL COMMENT '验证方法名',
    c_add_control_attr     VARCHAR(512) DEFAULT NULL COMMENT '新增控件属性',
    c_delete_control_attr  VARCHAR(512) DEFAULT NULL COMMENT '删除控件属性',
    c_oprt_type            TEXT         DEFAULT NULL COMMENT '操作类型(JSON)',
    c_oprt_button          TEXT         DEFAULT NULL COMMENT '操作按钮(JSON)',
    c_comp_flag            VARCHAR(32)  DEFAULT NULL COMMENT '组件标志',
    c_sql_searchsql        TEXT         DEFAULT NULL COMMENT '查询SQL',
    c_sql_insertsql        TEXT         DEFAULT NULL COMMENT '插入SQL',
    c_table_default_info   TEXT         DEFAULT NULL COMMENT '表格默认数据(JSON)',
    c_system_code          VARCHAR(64)  DEFAULT NULL COMMENT '系统代码',
    c_template_code        VARCHAR(128) DEFAULT NULL COMMENT '模板代码',
    create_by              VARCHAR(64)  DEFAULT NULL COMMENT '创建人',
    create_date            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    KEY idx_canvas_code (c_canvas_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='画布配置表';

-- 3. 画布元素表
CREATE TABLE IF NOT EXISTS tb_canvas_element (
    c_pk_id                VARCHAR(64)   NOT NULL COMMENT '主键',
    c_canvas_code          VARCHAR(128)  NOT NULL DEFAULT '' COMMENT '画布代码',
    c_elem_code            VARCHAR(128)  DEFAULT NULL COMMENT '元素代码',
    c_control_type         VARCHAR(32)   DEFAULT NULL COMMENT '控件类型',
    c_check_type           VARCHAR(32)   DEFAULT NULL COMMENT '校验类型',
    c_required_flag        VARCHAR(8)    DEFAULT NULL COMMENT '必填标志',
    c_readonly_flag        VARCHAR(8)    DEFAULT NULL COMMENT '只读标志',
    c_visible_flag         VARCHAR(8)    DEFAULT NULL COMMENT '可见标志',
    c_default_value        VARCHAR(256)  DEFAULT NULL COMMENT '默认值',
    c_enabled_flag         VARCHAR(8)    DEFAULT NULL COMMENT '启用标志',
    c_min_value            INT           DEFAULT NULL COMMENT '最小值',
    c_max_value            INT           DEFAULT NULL COMMENT '最大值',
    c_precision            INT           DEFAULT NULL COMMENT '精度',
    c_code_list_name       VARCHAR(256)  DEFAULT NULL COMMENT '代码列表名称',
    n_string_length        INT           DEFAULT NULL COMMENT '字符串长度',
    c_click_event_func     VARCHAR(128)  DEFAULT NULL COMMENT '点击事件方法',
    c_comp_code            VARCHAR(128)  DEFAULT NULL COMMENT '组件代码',
    n_elem_show_seq        DECIMAL(10,4) DEFAULT 0 COMMENT '元素显示顺序',
    c_elem_name            VARCHAR(256)  DEFAULT NULL COMMENT '元素中文名称',
    c_elem_ename           VARCHAR(256)  DEFAULT NULL COMMENT '元素英文名称',
    c_rel_field_name       VARCHAR(256)  DEFAULT NULL COMMENT '关联字段名',
    c_rel_table_name       VARCHAR(256)  DEFAULT NULL COMMENT '关联表名',
    c_control_attr         TEXT          DEFAULT NULL COMMENT '控件属性(JSON)',
    c_date_format          VARCHAR(64)   DEFAULT NULL COMMENT '日期格式',
    c_frontend_event       VARCHAR(256)  DEFAULT NULL COMMENT '前端事件',
    c_readonly_var         VARCHAR(128)  DEFAULT NULL COMMENT '只读变量',
    c_valid_control_attr   VARCHAR(512)  DEFAULT NULL COMMENT '校验控件属性',
    c_group_flag           VARCHAR(8)    DEFAULT NULL COMMENT '分组标志',
    c_group_first_item     VARCHAR(8)    DEFAULT NULL COMMENT '分组首项标志',
    c_client_group         VARCHAR(128)  DEFAULT NULL COMMENT '客户端分组',
    c_auto_select_first    VARCHAR(8)    DEFAULT NULL COMMENT '自动选择首项标志',
    c_tooltip_title        VARCHAR(256)  DEFAULT NULL COMMENT '提示标题',
    c_search_url           VARCHAR(512)  DEFAULT NULL COMMENT '搜索URL',
    c_search_param_key     VARCHAR(128)  DEFAULT NULL COMMENT '搜索参数键',
    c_search_result_key    VARCHAR(128)  DEFAULT NULL COMMENT '搜索结果键',
    c_search_select_event  VARCHAR(128)  DEFAULT NULL COMMENT '搜索选择事件',
    c_system_code          VARCHAR(64)   DEFAULT NULL COMMENT '系统代码',
    c_template_code        VARCHAR(128)  DEFAULT NULL COMMENT '模板代码',
    create_by              VARCHAR(64)   DEFAULT NULL COMMENT '创建人',
    create_date            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    KEY idx_canvas_code (c_canvas_code),
    KEY idx_elem_code (c_elem_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='画布元素表';

-- 4. 画布按钮表
CREATE TABLE IF NOT EXISTS tb_canvas_button (
    c_pk_id         VARCHAR(64)  NOT NULL COMMENT '主键',
    c_button_code   VARCHAR(128) DEFAULT NULL COMMENT '按钮代码',
    c_canvas_code   VARCHAR(128) DEFAULT NULL COMMENT '画布代码',
    c_button_name   VARCHAR(256) DEFAULT NULL COMMENT '按钮中文名称',
    c_button_ename  VARCHAR(256) DEFAULT NULL COMMENT '按钮英文名称',
    c_button_type   VARCHAR(32)  DEFAULT NULL COMMENT '按钮类型',
    c_event_name    VARCHAR(128) DEFAULT NULL COMMENT '事件方法名',
    n_show_order    INT          DEFAULT 0  COMMENT '显示顺序',
    c_system_code   VARCHAR(64)  DEFAULT NULL COMMENT '系统代码',
    create_by       VARCHAR(64)  DEFAULT NULL COMMENT '创建人',
    create_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    KEY idx_canvas_code (c_canvas_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='画布按钮表';

-- 5. 页面模板表
CREATE TABLE IF NOT EXISTS tb_page_template (
    c_pk_id           VARCHAR(64)  NOT NULL COMMENT '主键',
    c_template_code   VARCHAR(128) DEFAULT NULL COMMENT '模板代码',
    c_template_name   VARCHAR(256) DEFAULT NULL COMMENT '模板名称',
    c_template_desc   VARCHAR(512) DEFAULT NULL COMMENT '模板描述',
    c_template_type   VARCHAR(32)  DEFAULT NULL COMMENT '模板类型',
    c_del_flag        VARCHAR(8)   DEFAULT '0' COMMENT '删除标志',
    c_system_code     VARCHAR(64)  DEFAULT NULL COMMENT '系统代码',
    create_by         VARCHAR(64)  DEFAULT NULL COMMENT '创建人',
    create_date       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    UNIQUE KEY uk_template_code (c_template_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='页面模板表';

-- 6. 元素分组表
CREATE TABLE IF NOT EXISTS tb_element_group (
    c_pk_id         VARCHAR(64)  NOT NULL COMMENT '主键',
    c_group_code    VARCHAR(128) DEFAULT NULL COMMENT '分组代码',
    c_group_name    VARCHAR(256) DEFAULT NULL COMMENT '分组名称',
    c_group_desc    VARCHAR(512) DEFAULT NULL COMMENT '分组描述',
    c_group_type    VARCHAR(32)  DEFAULT NULL COMMENT '分组类型',
    c_group_tag     VARCHAR(128) DEFAULT NULL COMMENT '分组标签',
    c_system_code     VARCHAR(64)  DEFAULT NULL COMMENT '系统代码',
    c_elements_json   LONGTEXT     DEFAULT NULL COMMENT '组件元素JSON(完整属性+列数)',
    create_by         VARCHAR(64)  DEFAULT NULL COMMENT '创建人',
    create_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    UNIQUE KEY uk_group_code (c_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='元素分组表';

-- 7. 元素分组明细表
CREATE TABLE IF NOT EXISTS tb_element_group_item (
    c_pk_id         VARCHAR(64)  NOT NULL COMMENT '主键',
    c_group_code    VARCHAR(128) DEFAULT NULL COMMENT '分组代码',
    c_element_code  VARCHAR(128) DEFAULT NULL COMMENT '元素代码',
    c_canvas_code   VARCHAR(128) DEFAULT NULL COMMENT '画布代码',
    c_system_code   VARCHAR(64)  DEFAULT NULL COMMENT '系统代码',
    create_by       VARCHAR(64)  DEFAULT NULL COMMENT '创建人',
    create_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    KEY idx_group_code (c_group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='元素分组明细表';
