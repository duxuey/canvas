package com.hundsun.bontal.canvas.service;

import lombok.Data;
import java.util.Map;

/**
 * 画布配置服务接口
 */
public interface CanvasConfigService {

    void queryByCanvas(queryByCanvas.Input input, queryByCanvas.Output output);

    void updateConfig(updateConfig.Input input, updateConfig.Output output);

    interface queryByCanvas {
        @Data class Input { private String canvasCode; }
        @Data class Output { private Map<String, Object> config; }
    }

    interface updateConfig {
        @Data class Input {
            private String canvasCode;
            private String canvasType;
            private Integer columns;
            private String buttonsLayout;
            private String modifyFunc;
            private String calcEnvelopFunc;
            private String saveEnvelopFunc;
            private String queryEnvelopFunc;
            private String addEventFunc;
            private String deleteEventFunc;
            private String createEventFunc;
            private String verifyValidFunc;
            private String oprtType;
            private String oprtButton;
            private String compFlag;
            private String searchSql;
            private String insertSql;
        }
        @Data class Output {}
    }
}
