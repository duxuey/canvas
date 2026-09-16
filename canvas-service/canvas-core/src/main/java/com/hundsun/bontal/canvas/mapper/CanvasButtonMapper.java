package com.hundsun.bontal.canvas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.hundsun.bontal.canvas.model.CanvasButton;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 画布按钮 Mapper
 */
public interface CanvasButtonMapper extends BaseMapper<CanvasButton> {

    @Select("SELECT * FROM tb_canvas_button WHERE c_canvas_code = #{canvasCode}")
    List<CanvasButton> selectByCanvasCode(@Param("canvasCode") String canvasCode);
}
