package com.hundsun.bontal.canvas.type;

/**
 * 画布枚举定义
 */
public class CanvasEnum {

    /** 画布类型 */
    public enum CanvasType {
        FORM("form", "表单"),
        TABLE("table", "表格"),
        DASHBOARD("dashboard", "仪表盘"),
        CUSTOM("custom", "自定义");

        private String code;
        private String desc;

        CanvasType(String code, String desc) { this.code = code; this.desc = desc; }
        public String getCode() { return code; }
        public String getDesc() { return desc; }
    }

    /** 通用标志枚举 */
    public enum Flag {
        YES("1", "是"),
        NO("0", "否");

        private String code;
        private String desc;

        Flag(String code, String desc) { this.code = code; this.desc = desc; }
        public String getCode() { return code; }
        public String getDesc() { return desc; }
    }
}
