package com.hundsun.bontal.canvas.service;

import com.hundsun.bontal.common.dto.Options;
import com.hundsun.bontal.common.dto.Page;
import lombok.Data;

import java.util.List;

/**
 * 画布核心服务接口
 */
public interface CanvasService {

    /**
     * 保存画布
     */
    void saveCanvas(saveCanvas.Input input, saveCanvas.Output output);

    /**
     * 删除画布
     */
    void deleteCanvas(deleteCanvas.Input input, deleteCanvas.Output output);

    /**
     * 按系统+页面查询画布列表
     */
    void queryByPage(queryByPage.Input input, queryByPage.Output output);

    /**
     * 按画布代码查询详情
     */
    void queryByCode(queryByCode.Input input, queryByCode.Output output);

    /**
     * 更新画布JSON
     */
    void updateCanvasJson(updateCanvasJson.Input input, updateCanvasJson.Output output);

    /**
     * 编辑画布（组装JSON给前端编辑）
     */
    void editCanvas(editCanvas.Input input, editCanvas.Output output);

    /**
     * 画布预览
     */
    void previewCanvas(previewCanvas.Input input, previewCanvas.Output output);

    /**
     * 复制画布
     */
    void copyCanvas(copyCanvas.Input input, copyCanvas.Output output);

    /**
     * 页面预览（预览一个页面下所有画布）
     */
    void pagePreview(pagePreview.Input input, pagePreview.Output output);

    void queryBySystem(queryBySystem.Input input, queryBySystem.Output output);

    // ---- Input/Output DTOs ----

    interface saveCanvas {
        @Data class Input {
            private String canvasCode;
            private String canvasName;
            private String canvasEname;
            private String canvasType;
            private String canvasJson;
            private Integer showOrder;
            private String relJsFile;
            private String baseFlag;
            private String systemCode;
            private String pageCode;
            private String templateCode;
        }
        @Data class Output {
            private String canvasCode;
        }
    }

    interface deleteCanvas {
        @Data class Input {
            private String canvasCode;
        }
        @Data class Output {}
    }

    interface queryByPage {
        @Data class Input {
            private String systemCode;
            private String pageCode;
            private String canvasType;
            private String keyword;
            private int pageNum;
            private int pageSize;
        }
        @Data class Output {
            private Page<List<java.util.Map<String, Object>>> page;
        }
    }

    interface queryByCode {
        @Data class Input {
            private String canvasCode;
        }
        @Data class Output {
            private java.util.Map<String, Object> canvas;
        }
    }

    interface updateCanvasJson {
        @Data class Input {
            private String canvasCode;
            private String canvasJson;
            private String systemCode;
            private String pageCode;
        }
        @Data class Output {}
    }

    interface editCanvas {
        @Data class Input {
            private String canvasCode;
        }
        @Data class Output {
            private String canvasJson;
        }
    }

    interface previewCanvas {
        @Data class Input {
            private String canvasCode;
        }
        @Data class Output {
            private String previewJson;
        }
    }

    interface copyCanvas {
        @Data class Input {
            private String sourceCanvasCode;
            private String targetSystemCode;
            private String targetPageCode;
            private String targetCanvasName;
        }
        @Data class Output {
            private String newCanvasCode;
        }
    }

    interface pagePreview {
        @Data class Input {
            private String systemCode;
            private String pageCode;
        }
        @Data class Output {
            private String previewJson;
        }
    }

    interface queryBySystem {
        @Data class Input {
            private String systemCode;
        }
        @Data class Output {
            private java.util.List<java.util.Map<String, Object>> canvases;
        }
    }

    /**
     * 发布画布 —— 生成可适配其他系统的 JSON
     */
    void publishCanvas(publishCanvas.Input input, publishCanvas.Output output);

    interface publishCanvas {
        @Data class Input {
            private String canvasCode;
        }
        @Data class Output {
            private String publishJson;
        }
    }
}
