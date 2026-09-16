package com.hundsun.bontal.canvas.dao;

import com.hundsun.bontal.canvas.mapper.CanvasMapper;
import com.hundsun.bontal.canvas.model.Canvas;
import com.hundsun.bontal.common.exception.LTTSDaoException;
import com.hundsun.bontal.common.exception.LTTSDaoNoDataFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class CanvasDao {
    private static CanvasMapper mapper = null;

    @Autowired
    private CanvasDao(CanvasMapper mapper) {
        CanvasDao.mapper = mapper;
    }

    public static int insert(Canvas entity) {
        return mapper.insert(entity);
    }

    public static Canvas selectByCanvasCode(String canvasCode, boolean nullException) {
        Canvas obj = null;
        try {
            obj = mapper.selectByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询画布失败", e);
        }
        if (nullException && obj == null) {
            throw new LTTSDaoNoDataFoundException("查询画布失败，无对应记录");
        }
        return obj;
    }

    public static List<Canvas> selectBySystemAndPage(String systemCode, String pageCode) {
        try {
            return mapper.selectBySystemAndPage(systemCode, pageCode);
        } catch (Exception e) {
            throw new LTTSDaoException("按系统代码和页面代码查询画布失败", e);
        }
    }

    public static List<Canvas> selectBySystem(String systemCode) {
        try {
            return mapper.selectBySystem(systemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("按系统代码查询画布失败", e);
        }
    }

    public static List<Canvas> selectByTemplateCode(String templateCode) {
        try {
            return mapper.selectByTemplateCode(templateCode);
        } catch (Exception e) {
            throw new LTTSDaoException("按模板代码查询画布失败", e);
        }
    }

    public static int deleteByCanvasCode(String canvasCode) {
        try {
            return mapper.deleteByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除画布失败", e);
        }
    }

    public static int updateJsonByCode(Canvas entity) {
        try {
            return mapper.updateJsonByCode(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新画布JSON失败", e);
        }
    }

    public static int updateByCanvasCode(Canvas entity) {
        try {
            return mapper.updateByCanvasCode(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新画布失败", e);
        }
    }
}
