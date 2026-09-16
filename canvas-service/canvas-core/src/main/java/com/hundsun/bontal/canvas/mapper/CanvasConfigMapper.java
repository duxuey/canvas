package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.CanvasConfig;
import org.apache.ibatis.annotations.*;

/**
 * 画布配置 Mapper
 */
public interface CanvasConfigMapper extends BaseMapper<CanvasConfig> {

    @Select("SELECT * FROM tb_canvas_config WHERE c_canvas_code = #{canvasCode}")
    CanvasConfig selectByCanvasCode(@Param("canvasCode") String canvasCode);

    @Delete("DELETE FROM tb_canvas_config WHERE c_canvas_code = #{canvasCode}")
    int deleteByCanvasCode(@Param("canvasCode") String canvasCode);

    @Update("UPDATE tb_canvas_config SET n_columns = #{n_columns}, c_buttons_layout = #{c_buttons_layout}, c_modify_func = #{c_modify_func}, c_calc_envelop_func = #{c_calc_envelop_func}, c_save_envelop_func = #{c_save_envelop_func}, c_query_envelop_func = #{c_query_envelop_func}, c_add_event_func = #{c_add_event_func}, c_delete_event_func = #{c_delete_event_func}, c_create_event_func = #{c_create_event_func}, c_verify_valid_func = #{c_verify_valid_func}, c_oprt_type = #{c_oprt_type}, c_oprt_button = #{c_oprt_button}, c_comp_flag = #{c_comp_flag}, c_sql_searchsql = #{c_sql_searchsql}, c_sql_insertsql = #{c_sql_insertsql}, d_uptr_time = NOW() WHERE c_canvas_code = #{c_canvas_code}")
    int updateByCanvasCode(CanvasConfig entity);
}
