package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.CanvasElementService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/canvas_element")
public class CanvasElementController {

    @Autowired
    private CanvasElementService elementService;

    @TranCode("CANVASELEM01")
    @PostMapping("/query_by_canvas")
    public CanvasElementService.queryByCanvas.Output queryByCanvas(@RequestBody CanvasElementService.queryByCanvas.Input input) {
        CanvasElementService.queryByCanvas.Output output = new CanvasElementService.queryByCanvas.Output();
        elementService.queryByCanvas(input, output);
        return output;
    }

    @TranCode("CANVASELEM02")
    @PostMapping("/query_dynamic")
    public CanvasElementService.queryDynamic.Output queryDynamic(@RequestBody CanvasElementService.queryDynamic.Input input) {
        CanvasElementService.queryDynamic.Output output = new CanvasElementService.queryDynamic.Output();
        elementService.queryDynamic(input, output);
        return output;
    }

    @TranCode("CANVASELEM03")
    @PostMapping("/update_element")
    public CanvasElementService.updateElement.Output updateElement(@RequestBody CanvasElementService.updateElement.Input input) {
        CanvasElementService.updateElement.Output output = new CanvasElementService.updateElement.Output();
        elementService.updateElement(input, output);
        return output;
    }
}
