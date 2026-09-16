package com.hundsun.bontal.canvas.dao;

import com.hundsun.bontal.canvas.mapper.CanvasConfigMapper;
import com.hundsun.bontal.canvas.model.CanvasConfig;
import com.hundsun.bontal.common.exception.LTTSDaoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CanvasConfigDao {
    private static CanvasConfigMapper mapper = null;

    @Autowired
    private CanvasConfigDao(CanvasConfigMapper mapper) {
        CanvasConfigDao.mapper = mapper;
    }

    public static int insert(CanvasConfig entity) {
        return mapper.insert(entity);
    }

    public static CanvasConfig selectByCanvasCode(String canvasCode) {
        try {
            return mapper.selectByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询画布配置失败", e);
        }
    }

    public static int deleteByCanvasCode(String canvasCode) {
        try {
            return mapper.deleteByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除画布配置失败", e);
        }
    }

    public static int updateByCanvasCode(CanvasConfig entity) {
        try {
            return mapper.updateByCanvasCode(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新画布配置失败", e);
        }
    }
}
