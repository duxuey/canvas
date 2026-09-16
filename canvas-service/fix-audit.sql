-- Add missing audit columns to all canvas-service tables
USE core_db;

ALTER TABLE tb_canvas ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_canvas ADD COLUMN c_uptr_code VARCHAR(64) DEFAULT NULL COMMENT '更新人代码';
ALTER TABLE tb_canvas ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';
ALTER TABLE tb_canvas ADD COLUMN d_uptr_time DATETIME DEFAULT NULL COMMENT '更新时间';

ALTER TABLE tb_canvas_config ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_canvas_config ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';

ALTER TABLE tb_canvas_element ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_canvas_element ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';

ALTER TABLE tb_canvas_button ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_canvas_button ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';

ALTER TABLE tb_page_template ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_page_template ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';

ALTER TABLE tb_element_group ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_element_group ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';

ALTER TABLE tb_element_group_item ADD COLUMN c_crtr_code VARCHAR(64) DEFAULT NULL COMMENT '创建人代码';
ALTER TABLE tb_element_group_item ADD COLUMN d_crtr_time DATETIME DEFAULT NULL COMMENT '创建时间';
