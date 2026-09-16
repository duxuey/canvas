package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.ElementGroup;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * 元素分组 Mapper
 */
public interface ElementGroupMapper extends BaseMapper<ElementGroup> {

    @Select("SELECT c_group_code, c_group_name, c_group_desc, c_group_type, c_group_tag, c_system_code, c_elements_json FROM tb_element_group WHERE c_group_code = #{groupCode}")
    Map<String, Object> selectByGroupCode(@Param("groupCode") String groupCode);

    @Select("SELECT c_group_code, c_group_name, c_group_desc, c_group_type, c_group_tag, c_system_code, c_elements_json FROM tb_element_group WHERE c_system_code = #{systemCode}")
    List<Map<String, Object>> selectBySystemCode(@Param("systemCode") String systemCode);

    @Update("UPDATE tb_element_group SET c_group_name = #{c_group_name}, c_group_desc = #{c_group_desc}, c_group_type = #{c_group_type}, c_group_tag = #{c_group_tag}, c_elements_json = #{c_elements_json} WHERE c_group_code = #{c_group_code}")
    int updateByGroupCode(ElementGroup entity);

    @Delete("DELETE FROM tb_element_group WHERE c_group_code = #{groupCode}")
    int deleteByGroupCode(@Param("groupCode") String groupCode);
}
