package com.hundsun.bontal.canvas.service;

import lombok.Data;
import java.util.List;

/**
 * 画布元素服务接口
 */
public interface CanvasElementService {

    void queryByCanvas(queryByCanvas.Input input, queryByCanvas.Output output);

    void queryDynamic(queryDynamic.Input input, queryDynamic.Output output);

    void updateElement(updateElement.Input input, updateElement.Output output);

    interface queryByCanvas {
        @Data class Input { private String canvasCode; }
        @Data class Output { private List<java.util.Map<String, Object>> elements; }
    }

    interface queryDynamic {
        @Data class Input {
            private String canvasCode;
            private String elemCode;
            private String elemName;
            private String systemCode;
        }
        @Data class Output { private List<java.util.Map<String, Object>> elements; }
    }

    interface updateElement {
        @Data class Input {
            private String pkId;
            private String elemName;
            private String requiredFlag;
            private String readonlyFlag;
            private String visibleFlag;
            private String defaultValue;
            private String controlAttr;
            private java.math.BigDecimal showSeq;
        }
        @Data class Output {}
    }
}
