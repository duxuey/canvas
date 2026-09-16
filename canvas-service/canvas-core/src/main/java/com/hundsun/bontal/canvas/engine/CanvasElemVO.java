package com.hundsun.bontal.canvas.engine;

import java.util.ArrayList;
import java.util.List;

/**
 * 画布元素运行时VO (from SRElement)
 * 简化版本 — 删除保险专属字段(endr/visit/cvrg/duty/list/calc)
 */
public class CanvasElemVO {
    private String c_check_type;
    private String c_pk_id;
    private String c_control_type;
    private String c_max_value;
    private String c_precision;
    private String c_required_flag;
    private String c_rel_field_name;
    private String c_visible_flag;
    private String c_min_value;
    private String c_elem_name;
    private String c_rel_table_name;
    private String c_readonly_flag;
    private String c_default_value;
    private String c_comp_code;
    private String c_elem_code;
    private String c_enabled_flag;
    private String c_click_event_func;
    private String c_code_list_name;
    private String n_string_length;
    private String c_control_attr;
    private String c_valid_control_attr;
    private String c_client_group;
    private String c_auto_select_first;
    private String c_group_flag;
    private String c_group_first_item;
    private String c_tooltip_title;

    private int column_width;
    private String c_date_format;
    private String c_event_type;
    private List<CanvasEventFunc> eventList;
    private String c_frontend_event;
    private String c_back_event_func;
    private String c_readonly_var;

    // search-input fields
    private String c_search_url;
    private String c_search_param_key;
    private String c_search_result_key;
    private String c_search_select_event;

    private List<CanvasElemVO> fields = new ArrayList<CanvasElemVO>();

    public CanvasElemVO() {
        this.fields = new ArrayList<CanvasElemVO>();
    }

    // ---- Getters/Setters (abbreviated for brevity) ----

    public String getC_check_type() { return c_check_type; }
    public void setC_check_type(String c_check_type) { this.c_check_type = c_check_type; }
    public String getC_pk_id() { return c_pk_id; }
    public void setC_pk_id(String c_pk_id) { this.c_pk_id = c_pk_id; }
    public String getC_control_type() { return c_control_type; }
    public void setC_control_type(String c_control_type) { this.c_control_type = c_control_type; }
    public String getC_max_value() { return c_max_value; }
    public void setC_max_value(String c_max_value) { this.c_max_value = c_max_value; }
    public String getC_precision() { return c_precision; }
    public void setC_precision(String c_precision) { this.c_precision = c_precision; }
    public String getC_required_flag() { return c_required_flag; }
    public void setC_required_flag(String c_required_flag) { this.c_required_flag = c_required_flag; }
    public String getC_rel_field_name() { return c_rel_field_name; }
    public void setC_rel_field_name(String c_rel_field_name) { this.c_rel_field_name = c_rel_field_name; }
    public String getC_visible_flag() { return c_visible_flag; }
    public void setC_visible_flag(String c_visible_flag) { this.c_visible_flag = c_visible_flag; }
    public String getC_min_value() { return c_min_value; }
    public void setC_min_value(String c_min_value) { this.c_min_value = c_min_value; }
    public String getC_elem_name() { return c_elem_name; }
    public void setC_elem_name(String c_elem_name) { this.c_elem_name = c_elem_name; }
    public String getC_rel_table_name() { return c_rel_table_name; }
    public void setC_rel_table_name(String c_rel_table_name) { this.c_rel_table_name = c_rel_table_name; }
    public String getC_readonly_flag() { return c_readonly_flag; }
    public void setC_readonly_flag(String c_readonly_flag) { this.c_readonly_flag = c_readonly_flag; }
    public String getC_default_value() { return c_default_value; }
    public void setC_default_value(String c_default_value) { this.c_default_value = c_default_value; }
    public String getC_comp_code() { return c_comp_code; }
    public void setC_comp_code(String c_comp_code) { this.c_comp_code = c_comp_code; }
    public String getC_elem_code() { return c_elem_code; }
    public void setC_elem_code(String c_elem_code) { this.c_elem_code = c_elem_code; }
    public String getC_enabled_flag() { return c_enabled_flag; }
    public void setC_enabled_flag(String c_enabled_flag) { this.c_enabled_flag = c_enabled_flag; }
    public String getC_click_event_func() { return c_click_event_func; }
    public void setC_click_event_func(String c_click_event_func) { this.c_click_event_func = c_click_event_func; }
    public String getC_code_list_name() { return c_code_list_name; }
    public void setC_code_list_name(String c_code_list_name) { this.c_code_list_name = c_code_list_name; }
    public String getN_string_length() { return n_string_length; }
    public void setN_string_length(String n_string_length) { this.n_string_length = n_string_length; }
    public String getC_control_attr() { return c_control_attr; }
    public void setC_control_attr(String c_control_attr) { this.c_control_attr = c_control_attr; }
    public String getC_valid_control_attr() { return c_valid_control_attr; }
    public void setC_valid_control_attr(String c_valid_control_attr) { this.c_valid_control_attr = c_valid_control_attr; }
    public String getC_client_group() { return c_client_group; }
    public void setC_client_group(String c_client_group) { this.c_client_group = c_client_group; }
    public String getC_auto_select_first() { return c_auto_select_first; }
    public void setC_auto_select_first(String c_auto_select_first) { this.c_auto_select_first = c_auto_select_first; }
    public String getC_group_flag() { return c_group_flag; }
    public void setC_group_flag(String c_group_flag) { this.c_group_flag = c_group_flag; }
    public String getC_group_first_item() { return c_group_first_item; }
    public void setC_group_first_item(String c_group_first_item) { this.c_group_first_item = c_group_first_item; }
    public String getC_tooltip_title() { return c_tooltip_title; }
    public void setC_tooltip_title(String c_tooltip_title) { this.c_tooltip_title = c_tooltip_title; }
    public int getColumn_width() { return column_width; }
    public void setColumn_width(int column_width) { this.column_width = column_width; }
    public String getC_date_format() { return c_date_format; }
    public void setC_date_format(String c_date_format) { this.c_date_format = c_date_format; }
    public String getC_event_type() { return c_event_type; }
    public void setC_event_type(String c_event_type) { this.c_event_type = c_event_type; }
    public List<CanvasEventFunc> getEventList() { return eventList; }
    public void setEventList(List<CanvasEventFunc> eventList) { this.eventList = eventList; }
    public String getC_frontend_event() { return c_frontend_event; }
    public void setC_frontend_event(String c_frontend_event) { this.c_frontend_event = c_frontend_event; }
    public String getC_back_event_func() { return c_back_event_func; }
    public void setC_back_event_func(String c_back_event_func) { this.c_back_event_func = c_back_event_func; }
    public String getC_readonly_var() { return c_readonly_var; }
    public void setC_readonly_var(String c_readonly_var) { this.c_readonly_var = c_readonly_var; }
    public String getC_search_url() { return c_search_url; }
    public void setC_search_url(String c_search_url) { this.c_search_url = c_search_url; }
    public String getC_search_param_key() { return c_search_param_key; }
    public void setC_search_param_key(String c_search_param_key) { this.c_search_param_key = c_search_param_key; }
    public String getC_search_result_key() { return c_search_result_key; }
    public void setC_search_result_key(String c_search_result_key) { this.c_search_result_key = c_search_result_key; }
    public String getC_search_select_event() { return c_search_select_event; }
    public void setC_search_select_event(String c_search_select_event) { this.c_search_select_event = c_search_select_event; }

    public List<CanvasElemVO> getFields() { return fields; }
    public void setFields(List<CanvasElemVO> fields) { this.fields = fields; }
    public void addField(CanvasElemVO field) { this.fields.add(field); }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) return false;
        if (obj instanceof CanvasElemVO) {
            CanvasElemVO objElem = (CanvasElemVO) obj;
            if (this.c_rel_field_name != null && this.c_rel_table_name != null
                    && this.c_rel_field_name.equals(objElem.getC_rel_field_name())
                    && this.c_rel_table_name.equals(objElem.getC_rel_table_name())) {
                return true;
            }
        }
        return false;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("CanvasElemVO:{").append("\n");
        sb.append("c_control_type:").append(this.c_control_type).append(",").append("\n");
        sb.append("c_elem_name:").append(this.c_elem_name).append(",").append("\n");
        sb.append("c_elem_code:").append(this.c_elem_code).append(",");
        if (fields != null && !fields.isEmpty()) {
            sb.append("fields:[").append("\n");
            for (CanvasElemVO elem : fields) {
                sb.append(elem.toString()).append(",").append("\n");
            }
            sb.deleteCharAt(sb.length() - 2);
            sb.append("]").append("\n");
        }
        String endStr = sb.substring(sb.length() - 1);
        if (",".equals(endStr)) sb.deleteCharAt(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }
}
