package com.hundsun.bontal.canvas.service;

import lombok.Data;
import java.util.List;

/**
 * 画布按钮服务接口
 */
public interface CanvasButtonService {

    void queryByCanvas(queryByCanvas.Input input, queryByCanvas.Output output);

    interface queryByCanvas {
        @Data class Input { private String canvasCode; }
        @Data class Output { private List<java.util.Map<String, Object>> buttons; }
    }
}
