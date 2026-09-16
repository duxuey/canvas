package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.CanvasButtonService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/canvas_button")
public class CanvasButtonController {

    @Autowired
    private CanvasButtonService buttonService;

    @TranCode("CANVASBTN01")
    @PostMapping("/query_by_canvas")
    public CanvasButtonService.queryByCanvas.Output queryByCanvas(@RequestBody CanvasButtonService.queryByCanvas.Input input) {
        CanvasButtonService.queryByCanvas.Output output = new CanvasButtonService.queryByCanvas.Output();
        buttonService.queryByCanvas(input, output);
        return output;
    }
}
