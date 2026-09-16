package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.CanvasPublish;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 画布发布记录 Mapper
 */
public interface CanvasPublishMapper extends BaseMapper<CanvasPublish> {

    @Select("SELECT * FROM tb_canvas_publish WHERE c_canvas_code = #{canvasCode} ORDER BY n_version DESC")
    @Results(id = "CanvasPublishResult", value = {
        @Result(property = "c_pk_id", column = "c_pk_id"),
        @Result(property = "c_canvas_code", column = "c_canvas_code"),
        @Result(property = "n_version", column = "n_version"),
        @Result(property = "c_version_name", column = "c_version_name"),
        @Result(property = "c_publish_json", column = "c_publish_json"),
        @Result(property = "c_publish_note", column = "c_publish_note"),
        @Result(property = "c_status", column = "c_status"),
        @Result(property = "c_system_code", column = "c_system_code"),
        @Result(property = "c_crtr_code", column = "c_crtr_code"),
        @Result(property = "d_crtr_time", column = "d_crtr_time"),
        @Result(property = "d_uptr_time", column = "d_uptr_time"),
    })
    List<CanvasPublish> selectByCanvasCode(@Param("canvasCode") String canvasCode);

    @Select("SELECT * FROM tb_canvas_publish WHERE c_canvas_code = #{canvasCode} ORDER BY n_version DESC LIMIT 1")
    @ResultMap("CanvasPublishResult")
    CanvasPublish selectLatestByCanvasCode(@Param("canvasCode") String canvasCode);

    @Select("SELECT * FROM tb_canvas_publish WHERE c_pk_id = #{pkId}")
    @ResultMap("CanvasPublishResult")
    CanvasPublish selectByPkId(@Param("pkId") String pkId);

    @Select("SELECT COALESCE(MAX(n_version), 0) FROM tb_canvas_publish WHERE c_canvas_code = #{canvasCode}")
    int selectMaxVersion(@Param("canvasCode") String canvasCode);

    @Insert("INSERT INTO tb_canvas_publish (c_pk_id, c_canvas_code, n_version, c_version_name, c_publish_json, c_publish_note, c_status, c_system_code, d_crtr_time, d_uptr_time) " +
            "VALUES (#{c_pk_id}, #{c_canvas_code}, #{n_version}, #{c_version_name}, #{c_publish_json}, #{c_publish_note}, #{c_status}, #{c_system_code}, NOW(), NOW())")
    int insertPublish(CanvasPublish entity);

    @Update("UPDATE tb_canvas_publish SET c_version_name = #{c_version_name}, c_publish_note = #{c_publish_note}, c_status = #{c_status}, d_uptr_time = NOW() WHERE c_pk_id = #{c_pk_id}")
    int updateMeta(CanvasPublish entity);

    @Update("UPDATE tb_canvas_publish SET c_status = 'deprecated', d_uptr_time = NOW() WHERE c_pk_id = #{pkId}")
    int deprecate(@Param("pkId") String pkId);

    @Delete("DELETE FROM tb_canvas_publish WHERE c_canvas_code = #{canvasCode}")
    int deleteByCanvasCode(@Param("canvasCode") String canvasCode);

    @Select("SELECT * FROM tb_canvas_publish WHERE c_system_code = #{systemCode} ORDER BY d_crtr_time DESC")
    @ResultMap("CanvasPublishResult")
    List<CanvasPublish> selectBySystem(@Param("systemCode") String systemCode);
}
