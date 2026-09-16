package com.hundsun.bontal.canvas.service;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 画布发布记录服务接口
 */
public interface CanvasPublishService {

    /**
     * 发布画布（保存新版本）
     */
    void publish(publish.Input input, publish.Output output);

    /**
     * 查询画布的发布版本列表
     */
    void queryVersions(queryVersions.Input input, queryVersions.Output output);

    /**
     * 查询单条发布记录详情
     */
    void queryDetail(queryDetail.Input input, queryDetail.Output output);

    /**
     * 更新发布记录元数据（名称、备注、状态）
     */
    void updateMeta(updateMeta.Input input, updateMeta.Output output);

    /**
     * 废弃某个发布版本
     */
    void deprecate(deprecate.Input input, deprecate.Output output);

    // ---- Input/Output DTOs ----

    interface publish {
        @Data class Input {
            private String canvasCode;
            private String versionName;
            private String publishNote;
            private String systemCode;
        }
        @Data class Output {
            private String pkId;
            private Integer version;
            private String publishJson;
        }
    }

    interface queryVersions {
        @Data class Input {
            private String canvasCode;
        }
        @Data class Output {
            private List<Map<String, Object>> versions;
        }
    }

    interface queryDetail {
        @Data class Input {
            private String pkId;
        }
        @Data class Output {
            private Map<String, Object> detail;
        }
    }

    interface updateMeta {
        @Data class Input {
            private String pkId;
            private String versionName;
            private String publishNote;
            private String status;
        }
        @Data class Output {}
    }

    interface deprecate {
        @Data class Input {
            private String pkId;
        }
        @Data class Output {}
    }
}
