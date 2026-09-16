package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.ElementGroupItem;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 元素分组明细 Mapper
 */
public interface ElementGroupItemMapper extends BaseMapper<ElementGroupItem> {

    @Select("SELECT * FROM tb_element_group_item WHERE c_group_code = #{groupCode}")
    List<ElementGroupItem> selectByGroupCode(@Param("groupCode") String groupCode);

    @Delete("DELETE FROM tb_element_group_item WHERE c_group_code = #{groupCode}")
    int deleteByGroupCode(@Param("groupCode") String groupCode);

    @Delete("DELETE FROM tb_element_group_item WHERE c_group_code = #{groupCode} AND c_element_code = #{elemCode}")
    int deleteByGroupAndElem(@Param("groupCode") String groupCode, @Param("elemCode") String elemCode);
}
