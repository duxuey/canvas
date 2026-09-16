-- =====================================================
-- 画布 <-> 产品工厂 同步配置表（界面化开关管理）
-- =====================================================

USE core_db;

CREATE TABLE IF NOT EXISTS tb_sync_config (
    c_pk_id            VARCHAR(32)  NOT NULL COMMENT '主键ID（固定为 single）',
    c_enabled          VARCHAR(8)   NOT NULL DEFAULT '0' COMMENT '同步总开关: 0=关闭 1=开启',
    n_pull_interval    INT          NOT NULL DEFAULT 300000 COMMENT '拉取同步间隔（毫秒）',
    n_push_interval    INT          NOT NULL DEFAULT 600000 COMMENT '回写同步间隔（毫秒）',
    d_uptr_time        DATETIME     DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (c_pk_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布产品工厂同步配置表';

-- 插入默认单行配置（同步默认关闭）
INSERT INTO tb_sync_config (c_pk_id, c_enabled, n_pull_interval, n_push_interval, d_uptr_time)
VALUES ('single', '0', 300000, 600000, NOW())
ON DUPLICATE KEY UPDATE c_pk_id = c_pk_id;
