package com.hundsun.bontal.canvas.serviceimpl;

import com.hundsun.bontal.canvas.dao.CanvasDao;
import com.hundsun.bontal.canvas.dao.CanvasElementDao;
import com.hundsun.bontal.canvas.dao.CanvasConfigDao;
import com.hundsun.bontal.canvas.dao.PageTemplateDao;
import com.hundsun.bontal.canvas.model.Canvas;
import com.hundsun.bontal.canvas.model.PageTemplate;
import com.hundsun.bontal.canvas.service.PageTemplateService;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import com.hundsun.ta.utils.SnowflakeIdWorker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PageTemplateServiceImpl extends BusinessMinService implements PageTemplateService {

    @Override
    @Transactional
    public void saveTemplate(saveTemplate.Input input, saveTemplate.Output output) {
        String code = input.getTemplateCode();
        boolean isNew = (code == null || code.isEmpty());
        if (isNew) {
            code = String.valueOf(SnowflakeIdWorker.getId());
        }

        PageTemplate tpl = new PageTemplate();
        tpl.setC_template_code(code);
        tpl.setC_template_name(input.getTemplateName());
        tpl.setC_template_desc(input.getTemplateDesc());
        tpl.setC_template_type(input.getTemplateType());
        tpl.setC_system_code(input.getSystemCode());
        tpl.setC_del_flag("0");

        if (isNew) {
            tpl.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            PageTemplateDao.insert(tpl);
        } else {
            // Check if exists; update if yes, insert if no
            PageTemplate existing = PageTemplateDao.selectByTemplateCode(code, false);
            if (existing != null) {
                PageTemplateDao.updateByTemplateCode(tpl);
            } else {
                tpl.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
                PageTemplateDao.insert(tpl);
            }
        }
        output.setTemplateCode(code);
    }

    @Override
    @Transactional
    public void deleteTemplate(deleteTemplate.Input input, deleteTemplate.Output output) {
        // Delete elements and configs for each canvas under this template, then the canvases
        List<Canvas> canvases = CanvasDao.selectByTemplateCode(input.getTemplateCode());
        for (Canvas c : canvases) {
            CanvasElementDao.deleteByCanvasCode(c.getC_canvas_code());
            CanvasConfigDao.deleteByCanvasCode(c.getC_canvas_code());
            CanvasDao.deleteByCanvasCode(c.getC_canvas_code());
        }
        PageTemplateDao.deleteByTemplateCode(input.getTemplateCode());
    }

    @Override
    public void queryByCode(queryByCode.Input input, queryByCode.Output output) {
        PageTemplate tpl = PageTemplateDao.selectByTemplateCode(input.getTemplateCode(), true);
        output.setTemplate(BeanUtil.bean2Map(tpl));
    }

    @Override
    public void queryBySystem(queryBySystem.Input input, queryBySystem.Output output) {
        List<PageTemplate> templates = PageTemplateDao.selectBySystemCode(input.getSystemCode());
        List<Map<String, Object>> result = new ArrayList<>();
        for (PageTemplate t : templates) {
            result.add(BeanUtil.bean2Map(t));
        }
        output.setTemplates(result);
    }

    @Override
    public void queryCanvases(queryCanvases.Input input, queryCanvases.Output output) {
        List<Canvas> canvases = CanvasDao.selectByTemplateCode(input.getTemplateCode());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Canvas c : canvases) {
            result.add(BeanUtil.bean2Map(c));
        }
        output.setCanvases(result);
    }

    @Override
    @Transactional
    public void saveTemplateBatch(saveTemplateBatch.Input input, saveTemplateBatch.Output output) {
        // Save template
        saveTemplate.Input tplInput = new saveTemplate.Input();
        tplInput.setTemplateCode(input.getTemplateCode());
        tplInput.setTemplateName(input.getTemplateName());
        tplInput.setTemplateDesc(input.getTemplateDesc());
        tplInput.setTemplateType(input.getTemplateType());
        tplInput.setSystemCode(input.getSystemCode());
        saveTemplate.Output tplOutput = new saveTemplate.Output();
        saveTemplate(tplInput, tplOutput);

        // Save canvases under template
        if (input.getCanvases() != null) {
            for (saveTemplateBatch.CanvasData cd : input.getCanvases()) {
                Canvas canvas = new Canvas();
                canvas.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
                canvas.setC_canvas_code(cd.getCanvasCode() != null ? cd.getCanvasCode() : String.valueOf(SnowflakeIdWorker.getId()));
                canvas.setC_canvas_name(cd.getCanvasName());
                canvas.setC_canvas_ename(cd.getCanvasEname());
                canvas.setC_canvas_type(cd.getCanvasType());
                canvas.setC_canvas_json(cd.getCanvasJson());
                canvas.setN_show_order(cd.getShowOrder() != null ? cd.getShowOrder() : 0);
                canvas.setC_system_code(input.getSystemCode());
                canvas.setC_template_code(tplOutput.getTemplateCode());
                CanvasDao.insert(canvas);
            }
        }
    }
}
