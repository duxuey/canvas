package com.hundsun.bontal.canvas.dao;

import com.hundsun.bontal.canvas.mapper.CanvasButtonMapper;
import com.hundsun.bontal.canvas.model.CanvasButton;
import com.hundsun.bontal.common.exception.LTTSDaoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class CanvasButtonDao {
    private static CanvasButtonMapper mapper = null;

    @Autowired
    private CanvasButtonDao(CanvasButtonMapper mapper) {
        CanvasButtonDao.mapper = mapper;
    }

    public static List<CanvasButton> selectByCanvasCode(String canvasCode) {
        try {
            return mapper.selectByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询画布按钮失败", e);
        }
    }
}
