package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.CanvasService;
import com.hundsun.bontal.canvas.service.ProdCanvasSyncService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 画布管理 Controller (from ProdRelScreenController)
 */
@RestController
@RequestMapping("/canvas")
public class CanvasController {

    @Autowired
    private CanvasService canvasService;

    @Autowired
    private ProdCanvasSyncService syncService;

    @TranCode("CANVAS0001")
    @PostMapping("/save")
    public CanvasService.saveCanvas.Output saveCanvas(@RequestBody CanvasService.saveCanvas.Input input) {
        CanvasService.saveCanvas.Output output = new CanvasService.saveCanvas.Output();
        canvasService.saveCanvas(input, output);
        return output;
    }

    @TranCode("CANVAS0002")
    @PostMapping("/delete")
    public Map<String, Object> deleteCanvas(@RequestBody CanvasService.deleteCanvas.Input input) {
        CanvasService.deleteCanvas.Output output = new CanvasService.deleteCanvas.Output();
        canvasService.deleteCanvas(input, output);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("message", "画布删除成功");
        return result;
    }

    @TranCode("CANVAS0003")
    @PostMapping("/query_by_page")
    public CanvasService.queryByPage.Output queryByPage(@RequestBody CanvasService.queryByPage.Input input) {
        CanvasService.queryByPage.Output output = new CanvasService.queryByPage.Output();
        canvasService.queryByPage(input, output);
        return output;
    }

    @TranCode("CANVAS0004")
    @PostMapping("/query_by_code")
    public CanvasService.queryByCode.Output queryByCode(@RequestBody CanvasService.queryByCode.Input input) {
        CanvasService.queryByCode.Output output = new CanvasService.queryByCode.Output();
        canvasService.queryByCode(input, output);
        return output;
    }

    @TranCode("CANVAS0005")
    @PostMapping("/update_json_by_code")
    public Map<String, Object> updateCanvasJson(@RequestBody CanvasService.updateCanvasJson.Input input) {
        CanvasService.updateCanvasJson.Output output = new CanvasService.updateCanvasJson.Output();
        canvasService.updateCanvasJson(input, output);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }

    @TranCode("CANVAS0006")
    @PostMapping("/edit_canvas")
    public CanvasService.editCanvas.Output editCanvas(@RequestBody CanvasService.editCanvas.Input input) {
        CanvasService.editCanvas.Output output = new CanvasService.editCanvas.Output();
        canvasService.editCanvas(input, output);
        return output;
    }

    @TranCode("CANVAS0007")
    @PostMapping("/preview")
    public CanvasService.previewCanvas.Output previewCanvas(@RequestBody CanvasService.previewCanvas.Input input) {
        CanvasService.previewCanvas.Output output = new CanvasService.previewCanvas.Output();
        canvasService.previewCanvas(input, output);
        return output;
    }

    @TranCode("CANVAS0008")
    @PostMapping("/copy")
    public CanvasService.copyCanvas.Output copyCanvas(@RequestBody CanvasService.copyCanvas.Input input) {
        CanvasService.copyCanvas.Output output = new CanvasService.copyCanvas.Output();
        canvasService.copyCanvas(input, output);
        return output;
    }

    @TranCode("CANVAS0009")
    @PostMapping("/page_preview")
    public CanvasService.pagePreview.Output pagePreview(@RequestBody CanvasService.pagePreview.Input input) {
        CanvasService.pagePreview.Output output = new CanvasService.pagePreview.Output();
        canvasService.pagePreview(input, output);
        return output;
    }

    @TranCode("CANVAS0010")
    @PostMapping("/query_by_system")
    public CanvasService.queryBySystem.Output queryBySystem(@RequestBody CanvasService.queryBySystem.Input input) {
        CanvasService.queryBySystem.Output output = new CanvasService.queryBySystem.Output();
        canvasService.queryBySystem(input, output);
        return output;
    }

    @TranCode("CANVAS0011")
    @PostMapping("/publish")
    public CanvasService.publishCanvas.Output publishCanvas(@RequestBody CanvasService.publishCanvas.Input input) {
        CanvasService.publishCanvas.Output output = new CanvasService.publishCanvas.Output();
        canvasService.publishCanvas(input, output);
        return output;
    }

    /**
     * 手动同步：把指定画布回写到产品工厂（实时，不受系统全量同步开关控制）。
     */
    @PostMapping("/sync_to_prod")
    public Map<String, Object> syncToProd(@RequestBody Map<String, Object> input) {
        String canvasCode = (String) input.get("canvasCode");
        Map<String, Object> result = new HashMap<>();
        if (canvasCode == null || canvasCode.isEmpty()) {
            result.put("success", false);
            result.put("message", "画布代码不能为空");
            return result;
        }
        try {
            int n = syncService.pushCanvas(canvasCode);
            result.put("success", true);
            result.put("count", n);
            result.put("message", n > 0
                    ? "同步成功，回写组件数=" + n
                    : "同步完成，但该画布没有可同步的组件（仅组件会回写到产品工厂）");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage() != null && !e.getMessage().isEmpty()
                    ? e.getMessage() : "同步失败");
        }
        return result;
    }
}
