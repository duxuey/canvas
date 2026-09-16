package com.hundsun.bontal.canvas.service;

import lombok.Data;
import java.util.List;

/**
 * 页面模板服务接口
 */
public interface PageTemplateService {

    void saveTemplate(saveTemplate.Input input, saveTemplate.Output output);

    void deleteTemplate(deleteTemplate.Input input, deleteTemplate.Output output);

    void queryByCode(queryByCode.Input input, queryByCode.Output output);

    void queryBySystem(queryBySystem.Input input, queryBySystem.Output output);

    void queryCanvases(queryCanvases.Input input, queryCanvases.Output output);

    void saveTemplateBatch(saveTemplateBatch.Input input, saveTemplateBatch.Output output);

    interface saveTemplate {
        @Data class Input {
            private String templateCode;
            private String templateName;
            private String templateDesc;
            private String templateType;
            private String systemCode;
        }
        @Data class Output { private String templateCode; }
    }

    interface deleteTemplate {
        @Data class Input { private String templateCode; }
        @Data class Output {}
    }

    interface queryByCode {
        @Data class Input { private String templateCode; }
        @Data class Output { private java.util.Map<String, Object> template; }
    }

    interface queryBySystem {
        @Data class Input { private String systemCode; }
        @Data class Output { private List<java.util.Map<String, Object>> templates; }
    }

    interface queryCanvases {
        @Data class Input { private String templateCode; }
        @Data class Output { private List<java.util.Map<String, Object>> canvases; }
    }

    interface saveTemplateBatch {
        @Data class Input {
            private String templateCode;
            private String templateName;
            private String templateDesc;
            private String templateType;
            private String systemCode;
            private List<CanvasData> canvases;
        }
        @Data class CanvasData {
            private String canvasCode;
            private String canvasName;
            private String canvasEname;
            private String canvasType;
            private String canvasJson;
            private Integer showOrder;
        }
        @Data class Output {}
    }
}
