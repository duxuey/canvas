package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.PageTemplateService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/page_template")
public class PageTemplateController {

    @Autowired
    private PageTemplateService templateService;

    @TranCode("TMPL0001")
    @PostMapping("/save")
    public PageTemplateService.saveTemplate.Output saveTemplate(@RequestBody PageTemplateService.saveTemplate.Input input) {
        PageTemplateService.saveTemplate.Output output = new PageTemplateService.saveTemplate.Output();
        templateService.saveTemplate(input, output);
        return output;
    }

    @TranCode("TMPL0002")
    @PostMapping("/delete")
    public Map<String, Object> deleteTemplate(@RequestBody PageTemplateService.deleteTemplate.Input input) {
        PageTemplateService.deleteTemplate.Output output = new PageTemplateService.deleteTemplate.Output();
        templateService.deleteTemplate(input, output);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("message", "模板删除成功");
        return result;
    }

    @TranCode("TMPL0003")
    @PostMapping("/query_by_code")
    public PageTemplateService.queryByCode.Output queryByCode(@RequestBody PageTemplateService.queryByCode.Input input) {
        PageTemplateService.queryByCode.Output output = new PageTemplateService.queryByCode.Output();
        templateService.queryByCode(input, output);
        return output;
    }

    @TranCode("TMPL0004")
    @PostMapping("/query_by_system")
    public PageTemplateService.queryBySystem.Output queryBySystem(@RequestBody PageTemplateService.queryBySystem.Input input) {
        PageTemplateService.queryBySystem.Output output = new PageTemplateService.queryBySystem.Output();
        templateService.queryBySystem(input, output);
        return output;
    }

    @TranCode("TMPL0005")
    @PostMapping("/query_canvases")
    public PageTemplateService.queryCanvases.Output queryCanvases(@RequestBody PageTemplateService.queryCanvases.Input input) {
        PageTemplateService.queryCanvases.Output output = new PageTemplateService.queryCanvases.Output();
        templateService.queryCanvases(input, output);
        return output;
    }

    @TranCode("TMPL0006")
    @PostMapping("/save_batch")
    public PageTemplateService.saveTemplateBatch.Output saveTemplateBatch(@RequestBody PageTemplateService.saveTemplateBatch.Input input) {
        PageTemplateService.saveTemplateBatch.Output output = new PageTemplateService.saveTemplateBatch.Output();
        templateService.saveTemplateBatch(input, output);
        return output;
    }
}
