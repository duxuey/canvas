package com.hundsun.bontal.canvas.dao;

import com.hundsun.bontal.canvas.mapper.CanvasPublishMapper;
import com.hundsun.bontal.canvas.model.CanvasPublish;
import com.hundsun.bontal.common.exception.LTTSDaoException;
import com.hundsun.bontal.common.exception.LTTSDaoNoDataFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class CanvasPublishDao {
    private static CanvasPublishMapper mapper = null;

    @Autowired
    private CanvasPublishDao(CanvasPublishMapper mapper) {
        CanvasPublishDao.mapper = mapper;
    }

    public static int insert(CanvasPublish entity) {
        return mapper.insertPublish(entity);
    }

    public static List<CanvasPublish> selectByCanvasCode(String canvasCode) {
        try {
            return mapper.selectByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询发布记录失败", e);
        }
    }

    public static CanvasPublish selectLatestByCanvasCode(String canvasCode) {
        try {
            return mapper.selectLatestByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询最新发布记录失败", e);
        }
    }

    public static CanvasPublish selectByPkId(String pkId, boolean nullException) {
        CanvasPublish obj = null;
        try {
            obj = mapper.selectByPkId(pkId);
        } catch (Exception e) {
            throw new LTTSDaoException("查询发布记录详情失败", e);
        }
        if (nullException && obj == null) {
            throw new LTTSDaoNoDataFoundException("查询发布记录失败，无对应记录");
        }
        return obj;
    }

    public static int selectMaxVersion(String canvasCode) {
        try {
            return mapper.selectMaxVersion(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询最大版本号失败", e);
        }
    }

    public static int updateMeta(CanvasPublish entity) {
        try {
            return mapper.updateMeta(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新发布记录失败", e);
        }
    }

    public static int deprecate(String pkId) {
        try {
            return mapper.deprecate(pkId);
        } catch (Exception e) {
            throw new LTTSDaoException("废弃发布记录失败", e);
        }
    }

    public static int deleteByCanvasCode(String canvasCode) {
        try {
            return mapper.deleteByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除发布记录失败", e);
        }
    }

    public static List<CanvasPublish> selectBySystem(String systemCode) {
        try {
            return mapper.selectBySystem(systemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("按系统查询发布记录失败", e);
        }
    }
}
