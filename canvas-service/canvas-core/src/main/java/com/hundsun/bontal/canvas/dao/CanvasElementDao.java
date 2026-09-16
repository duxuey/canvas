package com.hundsun.bontal.canvas.dao;

import com.hundsun.bontal.canvas.mapper.CanvasElementMapper;
import com.hundsun.bontal.canvas.model.CanvasElement;
import com.hundsun.bontal.common.exception.LTTSDaoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class CanvasElementDao {
    private static CanvasElementMapper mapper = null;

    @Autowired
    private CanvasElementDao(CanvasElementMapper mapper) {
        CanvasElementDao.mapper = mapper;
    }

    public static int insert(CanvasElement entity) {
        return mapper.insert(entity);
    }

    public static List<CanvasElement> selectByCanvasCode(String canvasCode) {
        try {
            return mapper.selectByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询画布元素失败", e);
        }
    }

    public static int deleteByCanvasCode(String canvasCode) {
        try {
            return mapper.deleteByCanvasCode(canvasCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除画布元素失败", e);
        }
    }

    public static int batchInsert(List<CanvasElement> list) {
        try {
            return mapper.batchInsert(list);
        } catch (Exception e) {
            throw new LTTSDaoException("批量插入画布元素失败", e);
        }
    }

    public static int deleteByElemCode(String elemCode) {
        try {
            return mapper.deleteByElemCode(elemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除画布元素失败", e);
        }
    }

    public static int updateElementById(CanvasElement entity) {
        try {
            return mapper.updateElementById(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新画布元素失败", e);
        }
    }

    // --- Element Definition CRUD ---

    public static List<Map<String, Object>> selectDefsBySystem(String systemCode) {
        try {
            return mapper.selectDefsBySystem(systemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询元件定义失败", e);
        }
    }

    public static Map<String, Object> selectDefByCode(String elemCode, String systemCode) {
        try {
            return mapper.selectDefByCode(elemCode, systemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询元件定义失败", e);
        }
    }

    public static int deleteDefByCode(String elemCode, String systemCode) {
        try {
            return mapper.deleteDefByCode(elemCode, systemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除元件定义失败", e);
        }
    }

    public static int updateDefByCode(CanvasElement entity) {
        try {
            return mapper.updateDefByCode(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新元件定义失败", e);
        }
    }
}
