package com.hundsun.bontal.canvas.errors;

import com.hundsun.bontal.common.exception.LttsBusinessException;

/**
 * 画布服务错误码工厂
 */
public class CanvasErrors {

    public static LttsBusinessException canvasNotFound(String canvasCode) {
        return new LttsBusinessException("C0001", "画布不存在: " + canvasCode);
    }

    public static LttsBusinessException elementNotFound(String elemCode) {
        return new LttsBusinessException("C0002", "画布元素不存在: " + elemCode);
    }

    public static LttsBusinessException templateNotFound(String templateCode) {
        return new LttsBusinessException("C0003", "页面模板不存在: " + templateCode);
    }

    public static LttsBusinessException configNotFound(String canvasCode) {
        return new LttsBusinessException("C0004", "画布配置不存在: " + canvasCode);
    }

    public static LttsBusinessException invalidCanvasJson(String msg) {
        return new LttsBusinessException("C0005", "画布JSON解析失败: " + msg);
    }

    public static LttsBusinessException duplicateCanvasCode(String canvasCode) {
        return new LttsBusinessException("C0006", "画布代码已存在: " + canvasCode);
    }

    public static LttsBusinessException systemCodeRequired() {
        return new LttsBusinessException("C0007", "系统代码(system_code)不能为空");
    }

    public static LttsBusinessException deleteCanvasFailed(String msg) {
        return new LttsBusinessException("C0008", "删除画布失败: " + msg);
    }

    public static LttsBusinessException groupNotFound(String groupCode) {
        return new LttsBusinessException("C0009", "元素分组不存在: " + groupCode);
    }
}
