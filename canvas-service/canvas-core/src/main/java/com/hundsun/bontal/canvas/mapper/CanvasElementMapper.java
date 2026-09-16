package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.CanvasElement;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * 画布元素 Mapper
 */
public interface CanvasElementMapper extends BaseMapper<CanvasElement> {

    @Select("SELECT * FROM tb_canvas_element WHERE c_canvas_code = #{canvasCode} ORDER BY n_elem_show_seq ASC")
    List<CanvasElement> selectByCanvasCode(@Param("canvasCode") String canvasCode);

    @Delete("DELETE FROM tb_canvas_element WHERE c_canvas_code = #{canvasCode}")
    int deleteByCanvasCode(@Param("canvasCode") String canvasCode);

    @Insert("INSERT INTO tb_canvas_element (c_pk_id, c_canvas_code, c_elem_code, c_control_type, c_check_type, c_required_flag, c_readonly_flag, c_visible_flag, c_default_value, c_enabled_flag, c_min_value, c_max_value, c_precision, c_code_list_name, n_string_length, c_click_event_func, c_comp_code, n_elem_show_seq, c_elem_name, c_elem_ename, c_rel_field_name, c_rel_table_name, c_control_attr, c_date_format, c_frontend_event, c_readonly_var, c_valid_control_attr, c_group_flag, c_group_first_item, c_client_group, c_auto_select_first, c_tooltip_title, c_search_url, c_search_param_key, c_search_result_key, c_search_select_event, c_system_code, c_template_code, c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time) VALUES " +
            "(#{c_pk_id}, #{c_canvas_code}, #{c_elem_code}, #{c_control_type}, #{c_check_type}, #{c_required_flag}, #{c_readonly_flag}, #{c_visible_flag}, #{c_default_value}, #{c_enabled_flag}, #{c_min_value}, #{c_max_value}, #{c_precision}, #{c_code_list_name}, #{n_string_length}, #{c_click_event_func}, #{c_comp_code}, #{n_elem_show_seq}, #{c_elem_name}, #{c_elem_ename}, #{c_rel_field_name}, #{c_rel_table_name}, #{c_control_attr}, #{c_date_format}, #{c_frontend_event}, #{c_readonly_var}, #{c_valid_control_attr}, #{c_group_flag}, #{c_group_first_item}, #{c_client_group}, #{c_auto_select_first}, #{c_tooltip_title}, #{c_search_url}, #{c_search_param_key}, #{c_search_result_key}, #{c_search_select_event}, #{c_system_code}, #{c_template_code}, #{c_crtr_code}, #{c_uptr_code}, #{d_crtr_time}, #{d_uptr_time})")
    int batchInsert(List<CanvasElement> list);

    @Delete("DELETE FROM tb_canvas_element WHERE c_elem_code = #{elemCode}")
    int deleteByElemCode(@Param("elemCode") String elemCode);

    @Update("UPDATE tb_canvas_element SET c_elem_name = #{c_elem_name}, c_required_flag = #{c_required_flag}, c_readonly_flag = #{c_readonly_flag}, c_visible_flag = #{c_visible_flag}, c_default_value = #{c_default_value}, c_control_attr = #{c_control_attr}, n_elem_show_seq = #{n_elem_show_seq}, d_uptr_time = NOW() WHERE c_pk_id = #{c_pk_id}")
    int updateElementById(CanvasElement entity);

    // --- Element Definition CRUD ---

    @Select("SELECT c_elem_code AS elem_code, c_elem_name AS elem_name, c_elem_ename AS elem_ename, " +
            "c_control_type AS control_type, c_rel_table_name AS rel_table_name, " +
            "c_rel_field_name AS rel_field_name, c_default_value AS default_value, " +
            "c_tooltip_title AS tooltip_title, c_required_flag AS required_flag, " +
            "c_check_type AS check_type, c_min_value AS min_value, c_max_value AS max_value, " +
            "n_string_length AS string_length, c_code_list_name AS code_list_name, " +
            "c_control_attr AS control_attr " +
            "FROM tb_canvas_element WHERE c_system_code = #{systemCode} AND (c_canvas_code IS NULL OR c_canvas_code = '')")
    List<Map<String, Object>> selectDefsBySystem(@Param("systemCode") String systemCode);

    @Select("SELECT c_elem_code AS elem_code, c_elem_name AS elem_name, c_elem_ename AS elem_ename, " +
            "c_control_type AS control_type, c_rel_table_name AS rel_table_name, " +
            "c_rel_field_name AS rel_field_name, c_default_value AS default_value, " +
            "c_tooltip_title AS tooltip_title, c_required_flag AS required_flag, " +
            "c_check_type AS check_type, c_min_value AS min_value, c_max_value AS max_value, " +
            "n_string_length AS string_length, c_code_list_name AS code_list_name, " +
            "c_control_attr AS control_attr " +
            "FROM tb_canvas_element WHERE c_elem_code = #{elemCode} AND c_system_code = #{systemCode}")
    Map<String, Object> selectDefByCode(@Param("elemCode") String elemCode, @Param("systemCode") String systemCode);

    @Delete("DELETE FROM tb_canvas_element WHERE c_elem_code = #{elemCode} AND c_system_code = #{systemCode}")
    int deleteDefByCode(@Param("elemCode") String elemCode, @Param("systemCode") String systemCode);

    @Update("UPDATE tb_canvas_element SET c_elem_code = #{c_elem_code}, c_control_type = #{c_control_type}, " +
            "c_elem_name = #{c_elem_name}, c_elem_ename = #{c_elem_ename}, " +
            "c_rel_table_name = #{c_rel_table_name}, c_rel_field_name = #{c_rel_field_name}, " +
            "c_default_value = #{c_default_value}, c_tooltip_title = #{c_tooltip_title}, " +
            "c_required_flag = #{c_required_flag}, c_check_type = #{c_check_type}, " +
            "c_min_value = #{c_min_value}, c_max_value = #{c_max_value}, " +
            "n_string_length = #{n_string_length}, c_code_list_name = #{c_code_list_name}, " +
            "c_control_attr = #{c_control_attr}, " +
            "c_canvas_code = '', " +
            "d_uptr_time = NOW() WHERE c_elem_code = #{c_elem_code}")
    int updateDefByCode(CanvasElement entity);
}
