package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.Canvas;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 画布 Mapper
 */
public interface CanvasMapper extends BaseMapper<Canvas> {

    @Select("SELECT * FROM tb_canvas WHERE c_canvas_code = #{canvasCode}")
    @Results(id = "CanvasResult", value = {
        @Result(property = "c_pk_id", column = "c_pk_id"),
        @Result(property = "c_canvas_code", column = "c_canvas_code"),
        @Result(property = "c_canvas_name", column = "c_canvas_name"),
        @Result(property = "c_canvas_ename", column = "c_canvas_ename"),
        @Result(property = "c_canvas_type", column = "c_canvas_type"),
        @Result(property = "n_show_order", column = "n_show_order"),
        @Result(property = "c_rel_js_file", column = "c_rel_js_file"),
        @Result(property = "c_canvas_json", column = "c_canvas_json"),
        @Result(property = "c_base_flag", column = "c_base_flag"),
        @Result(property = "c_system_code", column = "c_system_code"),
        @Result(property = "c_page_code", column = "c_page_code"),
        @Result(property = "c_template_code", column = "c_template_code"),
        @Result(property = "c_remark", column = "c_remark"),
        @Result(property = "c_crtr_code", column = "c_crtr_code"),
        @Result(property = "d_crtr_time", column = "d_crtr_time"),
        @Result(property = "d_uptr_time", column = "d_uptr_time"),
    })
    Canvas selectByCanvasCode(@Param("canvasCode") String canvasCode);

    @Select("SELECT * FROM tb_canvas WHERE c_system_code = #{systemCode} AND c_page_code = #{pageCode} ORDER BY n_show_order ASC")
    @ResultMap("CanvasResult")
    List<Canvas> selectBySystemAndPage(@Param("systemCode") String systemCode, @Param("pageCode") String pageCode);

    @Select("SELECT * FROM tb_canvas WHERE c_system_code = #{systemCode} ORDER BY n_show_order ASC")
    @ResultMap("CanvasResult")
    List<Canvas> selectBySystem(@Param("systemCode") String systemCode);

    @Select("SELECT * FROM tb_canvas WHERE c_template_code = #{templateCode} ORDER BY n_show_order ASC")
    @ResultMap("CanvasResult")
    List<Canvas> selectByTemplateCode(@Param("templateCode") String templateCode);

    @Delete("DELETE FROM tb_canvas WHERE c_canvas_code = #{canvasCode}")
    int deleteByCanvasCode(@Param("canvasCode") String canvasCode);

    @Insert("INSERT INTO tb_canvas (c_pk_id, c_canvas_code, c_canvas_name, c_canvas_ename, c_canvas_type, n_show_order, c_rel_js_file, c_canvas_json, c_base_flag, c_system_code, c_page_code, c_template_code, c_remark) " +
            "VALUES (#{c_pk_id}, #{c_canvas_code}, #{c_canvas_name}, #{c_canvas_ename}, #{c_canvas_type}, #{n_show_order}, #{c_rel_js_file}, #{c_canvas_json}, #{c_base_flag}, #{c_system_code}, #{c_page_code}, #{c_template_code}, #{c_remark})")
    int insertForCopy(Canvas entity);

    @Update("UPDATE tb_canvas SET c_canvas_json = #{c_canvas_json}, c_canvas_name = #{c_canvas_name}, d_uptr_time = #{d_uptr_time} WHERE c_canvas_code = #{c_canvas_code}")
    int updateJsonByCode(Canvas entity);

    @Update("UPDATE tb_canvas SET c_canvas_name = #{c_canvas_name}, c_canvas_ename = #{c_canvas_ename}, c_canvas_type = #{c_canvas_type}, c_canvas_json = #{c_canvas_json}, n_show_order = #{n_show_order}, c_rel_js_file = #{c_rel_js_file}, c_base_flag = #{c_base_flag}, c_system_code = #{c_system_code}, c_page_code = #{c_page_code}, d_uptr_time = #{d_uptr_time} WHERE c_canvas_code = #{c_canvas_code}")
    int updateByCanvasCode(Canvas entity);
}
