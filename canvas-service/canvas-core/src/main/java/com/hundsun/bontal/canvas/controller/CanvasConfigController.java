package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.CanvasConfigService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/canvas_config")
public class CanvasConfigController {

    @Autowired
    private CanvasConfigService configService;

    @TranCode("CANVASCFG01")
    @PostMapping("/query_by_canvas")
    public CanvasConfigService.queryByCanvas.Output queryByCanvas(@RequestBody CanvasConfigService.queryByCanvas.Input input) {
        CanvasConfigService.queryByCanvas.Output output = new CanvasConfigService.queryByCanvas.Output();
        configService.queryByCanvas(input, output);
        return output;
    }

    @TranCode("CANVASCFG02")
    @PostMapping("/update_config")
    public CanvasConfigService.updateConfig.Output updateConfig(@RequestBody CanvasConfigService.updateConfig.Input input) {
        CanvasConfigService.updateConfig.Output output = new CanvasConfigService.updateConfig.Output();
        configService.updateConfig(input, output);
        return output;
    }
}
