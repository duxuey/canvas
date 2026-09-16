package com.hundsun.bontal.canvas.engine;

import java.util.ArrayList;
import java.util.List;

/**
 * 画布组件运行时VO (from SRComponent)
 * 简化版本 — 移除 endrRows/visitRows/cvrg* 等保险专属字段
 * 单一 row 集合 + table 集合 + 按钮集合
 */
public class CanvasComponent {
    // 组件基础数据
    private String c_canvas_code;
    private String c_canvas_name;
    private String c_canvas_ename;
    private String canvasType;
    private String is_readonly;
    private int columns;
    private String c_rel_table_name;

    // 表单数据 (单一row集合，替代原plcyRow/endrRow/visitRow/endrVisitRow四组)
    private List<CanvasRow> rows;

    // 表格数据
    private List<CanvasElemVO> tables;

    // 组件中的元件数据
    private List<CanvasElemVO> compElements;

    // 按钮数据
    private String buttonsLayout;
    private List<CanvasElemVO> buttons;

    // 事件方法名
    private String c_modify_func;
    private String c_calc_envelop_func;
    private String c_save_envelop_func;
    private String c_query_envelop_func;
    private String c_add_event_func;
    private String c_delete_event_func;
    private String c_create_event_func;
    private String c_verify_valid_func;

    // 按钮属性
    private String c_add_control_attr;
    private String c_delete_control_attr;
    private String c_oprt_button;
    private List<Object> c_oprt_type;

    // 组件标志
    private String compFlag;

    // SQL
    private String insertSql;
    private String searchSql;

    // 表格默认数据
    private List<Object> c_table_default_info;

    // 通用清单唯一因子
    private List uniquekeys;

    public CanvasComponent() {
        this.rows = new ArrayList<CanvasRow>();
        this.buttons = new ArrayList<CanvasElemVO>();
        this.tables = new ArrayList<CanvasElemVO>();
        this.compElements = new ArrayList<CanvasElemVO>();
    }

    public CanvasComponent(String c_canvas_name, String c_canvas_ename, String canvasType, String is_readonly) {
        this();
        this.c_canvas_name = c_canvas_name;
        this.c_canvas_ename = c_canvas_ename;
        this.canvasType = canvasType;
        this.is_readonly = is_readonly;
    }

    // ---- Getters/Setters ----

    public String getC_canvas_code() { return c_canvas_code; }
    public void setC_canvas_code(String c_canvas_code) { this.c_canvas_code = c_canvas_code; }
    public String getC_canvas_name() { return c_canvas_name; }
    public void setC_canvas_name(String c_canvas_name) { this.c_canvas_name = c_canvas_name; }
    public String getC_canvas_ename() { return c_canvas_ename; }
    public void setC_canvas_ename(String c_canvas_ename) { this.c_canvas_ename = c_canvas_ename; }
    public String getCanvasType() { return canvasType; }
    public void setCanvasType(String canvasType) { this.canvasType = canvasType; }
    public String getIs_readonly() { return is_readonly; }
    public void setIs_readonly(String is_readonly) { this.is_readonly = is_readonly; }
    public int getColumns() { return columns; }
    public void setColumns(int columns) { this.columns = columns; }
    public String getC_rel_table_name() { return c_rel_table_name; }
    public void setC_rel_table_name(String c_rel_table_name) { this.c_rel_table_name = c_rel_table_name; }
    public List<CanvasRow> getRows() { return rows; }
    public void addRow(CanvasRow row) { this.rows.add(row); }
    public List<CanvasElemVO> getTables() { return tables; }
    public void addTableColumn(CanvasElemVO column) { this.tables.add(column); }
    public List<CanvasElemVO> getCompElements() { return compElements; }
    public void addCompElements(CanvasElemVO elem) { this.compElements.add(elem); }
    public String getButtonsLayout() { return buttonsLayout; }
    public void setButtonsLayout(String buttonsLayout) { this.buttonsLayout = buttonsLayout; }
    public List<CanvasElemVO> getButtons() { return buttons; }
    public void addButton(CanvasElemVO button) { this.buttons.add(button); }

    public String getC_modify_func() { return c_modify_func; }
    public void setC_modify_func(String c_modify_func) { this.c_modify_func = c_modify_func; }
    public String getC_calc_envelop_func() { return c_calc_envelop_func; }
    public void setC_calc_envelop_func(String c_calc_envelop_func) { this.c_calc_envelop_func = c_calc_envelop_func; }
    public String getC_save_envelop_func() { return c_save_envelop_func; }
    public void setC_save_envelop_func(String c_save_envelop_func) { this.c_save_envelop_func = c_save_envelop_func; }
    public String getC_query_envelop_func() { return c_query_envelop_func; }
    public void setC_query_envelop_func(String c_query_envelop_func) { this.c_query_envelop_func = c_query_envelop_func; }
    public String getC_add_event_func() { return c_add_event_func; }
    public void setC_add_event_func(String c_add_event_func) { this.c_add_event_func = c_add_event_func; }
    public String getC_delete_event_func() { return c_delete_event_func; }
    public void setC_delete_event_func(String c_delete_event_func) { this.c_delete_event_func = c_delete_event_func; }
    public String getC_create_event_func() { return c_create_event_func; }
    public void setC_create_event_func(String c_create_event_func) { this.c_create_event_func = c_create_event_func; }
    public String getC_verify_valid_func() { return c_verify_valid_func; }
    public void setC_verify_valid_func(String c_verify_valid_func) { this.c_verify_valid_func = c_verify_valid_func; }
    public String getC_add_control_attr() { return c_add_control_attr; }
    public void setC_add_control_attr(String c_add_control_attr) { this.c_add_control_attr = c_add_control_attr; }
    public String getC_delete_control_attr() { return c_delete_control_attr; }
    public void setC_delete_control_attr(String c_delete_control_attr) { this.c_delete_control_attr = c_delete_control_attr; }
    public String getC_oprt_button() { return c_oprt_button; }
    public void setC_oprt_button(String c_oprt_button) { this.c_oprt_button = c_oprt_button; }
    public List<Object> getC_oprt_type() { return c_oprt_type; }
    public void setC_oprt_type(List<Object> c_oprt_type) { this.c_oprt_type = c_oprt_type; }
    public String getCompFlag() { return compFlag; }
    public void setCompFlag(String compFlag) { this.compFlag = compFlag; }
    public String getInsertSql() { return insertSql; }
    public void setInsertSql(String insertSql) { this.insertSql = insertSql; }
    public String getSearchSql() { return searchSql; }
    public void setSearchSql(String searchSql) { this.searchSql = searchSql; }
    public List<Object> getC_table_default_info() { return c_table_default_info; }
    public void setC_table_default_info(List<Object> c_table_default_info) { this.c_table_default_info = c_table_default_info; }
    public List getUniquekeys() { return uniquekeys; }
    public void setUniquekeys(List uniquekeys) { this.uniquekeys = uniquekeys; }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("CanvasComponent:{").append("\n");
        sb.append("c_canvas_name:").append(this.c_canvas_name).append(",\n");
        sb.append("c_canvas_ename:").append(this.c_canvas_ename).append(",\n");
        sb.append("rows:[").append("\n");
        if (!rows.isEmpty()) {
            for (CanvasRow row : rows) {
                sb.append(row.toString()).append(",").append("\n");
            }
            sb.deleteCharAt(sb.length() - 2);
        }
        sb.append("]").append("\n");
        sb.append("tables:[").append("\n");
        if (!tables.isEmpty()) {
            for (CanvasElemVO elem : tables) {
                sb.append(elem.toString()).append(",").append("\n");
            }
            sb.deleteCharAt(sb.length() - 2);
        }
        sb.append("]").append("\n");
        sb.append("buttons:[").append("\n");
        if (!buttons.isEmpty()) {
            for (CanvasElemVO btn : buttons) {
                sb.append(btn.toString()).append(",").append("\n");
            }
            sb.deleteCharAt(sb.length() - 2);
        }
        sb.append("]").append("\n");
        sb.append("}").append("\n");
        return sb.toString();
    }
}
