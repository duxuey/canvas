package com.hundsun.bontal.canvas.service;

import lombok.Data;
import java.util.List;

/**
 * 元素分组服务接口
 */
public interface ElementGroupService {

    void saveGroup(saveGroup.Input input, saveGroup.Output output);

    void deleteGroup(deleteGroup.Input input, deleteGroup.Output output);

    void queryBySystem(queryBySystem.Input input, queryBySystem.Output output);

    void addItem(addItem.Input input, addItem.Output output);

    void deleteItem(deleteItem.Input input, deleteItem.Output output);

    void queryItems(queryItems.Input input, queryItems.Output output);

    interface saveGroup {
        @Data class Input {
            private String groupCode;
            private String groupName;
            private String groupDesc;
            private String groupType;
            private String groupTag;
            private String systemCode;
            private Integer columns;
            private List<java.util.Map<String, Object>> elements;
        }
        @Data class Output { private String groupCode; }
    }

    interface deleteGroup {
        @Data class Input { private String groupCode; }
        @Data class Output {}
    }

    interface queryBySystem {
        @Data class Input { private String systemCode; }
        @Data class Output { private List<java.util.Map<String, Object>> groups; }
    }

    interface addItem {
        @Data class Input {
            private String groupCode;
            private String elemCode;
            private String canvasCode;
            private String systemCode;
        }
        @Data class Output {}
    }

    interface deleteItem {
        @Data class Input {
            private String groupCode;
            private String elemCode;
        }
        @Data class Output {}
    }

    interface queryItems {
        @Data class Input { private String groupCode; }
        @Data class Output { private List<java.util.Map<String, Object>> items; }
    }
}
