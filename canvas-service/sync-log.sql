-- =====================================================
-- 画布 <-> 产品工厂 双向同步相关 schema
-- =====================================================

USE core_db;

-- 1. 同步日志表
CREATE TABLE IF NOT EXISTS tb_canvas_sync_log (
    c_pk_id        VARCHAR(32)  NOT NULL COMMENT '主键ID',
    c_direction    VARCHAR(16)  NOT NULL COMMENT '同步方向: PULL(产品工厂->画布) / PUSH(画布->产品工厂)',
    c_table_name   VARCHAR(64)  NOT NULL COMMENT '同步的表名',
    n_row_count    INT          DEFAULT 0 COMMENT '影响行数',
    d_start_time   DATETIME     DEFAULT NULL COMMENT '开始时间',
    d_end_time     DATETIME     DEFAULT NULL COMMENT '结束时间',
    c_status       VARCHAR(16)  DEFAULT 'SUCCESS' COMMENT '状态: SUCCESS/FAILED/SKIPPED',
    c_message      VARCHAR(1000) DEFAULT NULL COMMENT '备注/异常信息',
    d_crtr_time    DATETIME     DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (c_pk_id),
    KEY idx_direction (c_direction),
    KEY idx_start_time (d_start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布产品工厂双向同步日志表';

-- 2. 元件表唯一键（增量拉取 upsert 依赖：ON DUPLICATE KEY UPDATE）
--    一个画面内元件代码唯一。执行前需确认无重复：
--    SELECT COUNT(*), COUNT(DISTINCT c_canvas_code, c_elem_code) FROM tb_canvas_element;
ALTER TABLE tb_canvas_element
    ADD UNIQUE KEY uk_canvas_elem (c_canvas_code, c_elem_code);
