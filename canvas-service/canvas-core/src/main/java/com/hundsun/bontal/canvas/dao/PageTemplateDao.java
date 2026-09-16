package com.hundsun.bontal.canvas.dao;

import com.hundsun.bontal.canvas.mapper.PageTemplateMapper;
import com.hundsun.bontal.canvas.model.PageTemplate;
import com.hundsun.bontal.common.exception.LTTSDaoException;
import com.hundsun.bontal.common.exception.LTTSDaoNoDataFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class PageTemplateDao {
    private static PageTemplateMapper mapper = null;

    @Autowired
    private PageTemplateDao(PageTemplateMapper mapper) {
        PageTemplateDao.mapper = mapper;
    }

    public static int insert(PageTemplate entity) {
        return mapper.insert(entity);
    }

    public static PageTemplate selectByTemplateCode(String templateCode, boolean nullException) {
        PageTemplate obj = null;
        try {
            obj = mapper.selectByTemplateCode(templateCode);
        } catch (Exception e) {
            throw new LTTSDaoException("查询页面模板失败", e);
        }
        if (nullException && obj == null) {
            throw new LTTSDaoNoDataFoundException("查询页面模板失败，无对应记录");
        }
        return obj;
    }

    public static List<PageTemplate> selectBySystemCode(String systemCode) {
        try {
            return mapper.selectBySystemCode(systemCode);
        } catch (Exception e) {
            throw new LTTSDaoException("按系统代码查询模板失败", e);
        }
    }

    public static int deleteByTemplateCode(String templateCode) {
        try {
            return mapper.deleteByTemplateCode(templateCode);
        } catch (Exception e) {
            throw new LTTSDaoException("删除页面模板失败", e);
        }
    }

    public static int updateByTemplateCode(PageTemplate entity) {
        try {
            return mapper.updateByTemplateCode(entity);
        } catch (Exception e) {
            throw new LTTSDaoException("更新页面模板失败", e);
        }
    }
}
