package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.PageTemplate;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 页面模板 Mapper
 */
public interface PageTemplateMapper extends BaseMapper<PageTemplate> {

    @Select("SELECT * FROM tb_page_template WHERE c_template_code = #{templateCode}")
    @Results(id = "PageTemplateResult", value = {
        @Result(property = "c_pk_id", column = "c_pk_id"),
        @Result(property = "c_template_code", column = "c_template_code"),
        @Result(property = "c_template_name", column = "c_template_name"),
        @Result(property = "c_template_desc", column = "c_template_desc"),
        @Result(property = "c_template_type", column = "c_template_type"),
        @Result(property = "c_del_flag", column = "c_del_flag"),
        @Result(property = "c_system_code", column = "c_system_code"),
        @Result(property = "c_crtr_code", column = "c_crtr_code"),
        @Result(property = "d_crtr_time", column = "d_crtr_time"),
    })
    PageTemplate selectByTemplateCode(@Param("templateCode") String templateCode);

    @Select("SELECT * FROM tb_page_template WHERE c_system_code = #{systemCode}")
    @ResultMap("PageTemplateResult")
    List<PageTemplate> selectBySystemCode(@Param("systemCode") String systemCode);

    @Delete("DELETE FROM tb_page_template WHERE c_template_code = #{templateCode}")
    int deleteByTemplateCode(@Param("templateCode") String templateCode);

    @Update("UPDATE tb_page_template SET c_template_name = #{c_template_name}, c_template_desc = #{c_template_desc}, c_template_type = #{c_template_type}, d_uptr_time = NOW() WHERE c_template_code = #{c_template_code}")
    int updateByTemplateCode(PageTemplate entity);
}
