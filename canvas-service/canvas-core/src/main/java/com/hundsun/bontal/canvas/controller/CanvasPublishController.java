package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.CanvasPublishService;
import com.hundsun.bontal.common.annotation.TranCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 画布发布记录 Controller
 */
@RestController
@RequestMapping("/canvas_publish")
public class CanvasPublishController {

    @Autowired
    private CanvasPublishService publishService;

    @TranCode("CANVASPUB01")
    @PostMapping("/publish")
    public CanvasPublishService.publish.Output publish(@RequestBody CanvasPublishService.publish.Input input) {
        CanvasPublishService.publish.Output output = new CanvasPublishService.publish.Output();
        publishService.publish(input, output);
        return output;
    }

    @TranCode("CANVASPUB02")
    @PostMapping("/versions")
    public CanvasPublishService.queryVersions.Output queryVersions(@RequestBody CanvasPublishService.queryVersions.Input input) {
        CanvasPublishService.queryVersions.Output output = new CanvasPublishService.queryVersions.Output();
        publishService.queryVersions(input, output);
        return output;
    }

    @TranCode("CANVASPUB03")
    @PostMapping("/detail")
    public CanvasPublishService.queryDetail.Output queryDetail(@RequestBody CanvasPublishService.queryDetail.Input input) {
        CanvasPublishService.queryDetail.Output output = new CanvasPublishService.queryDetail.Output();
        publishService.queryDetail(input, output);
        return output;
    }

    @TranCode("CANVASPUB04")
    @PostMapping("/update")
    public CanvasPublishService.updateMeta.Output updateMeta(@RequestBody CanvasPublishService.updateMeta.Input input) {
        CanvasPublishService.updateMeta.Output output = new CanvasPublishService.updateMeta.Output();
        publishService.updateMeta(input, output);
        return output;
    }

    @TranCode("CANVASPUB05")
    @PostMapping("/deprecate")
    public CanvasPublishService.deprecate.Output deprecate(@RequestBody CanvasPublishService.deprecate.Input input) {
        CanvasPublishService.deprecate.Output output = new CanvasPublishService.deprecate.Output();
        publishService.deprecate(input, output);
        return output;
    }
}
