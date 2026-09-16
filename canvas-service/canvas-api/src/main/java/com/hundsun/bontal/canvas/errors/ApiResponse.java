package com.hundsun.bontal.canvas.errors;

import java.util.*;

/**
 * 统一 API 响应信封，对应规范 V1.0 3.2 节：
 * { code, message, issues?, data?, traceId, retryable }
 *
 * 用法：
 *   return ApiResponse.ok(data);
 *   return ApiResponse.fail(ApiErrors.NOT_FOUND, "画布不存在", false);
 */
public final class ApiResponse {

    public static Map<String, Object> ok() {
        return ok(null);
    }

    public static Map<String, Object> ok(Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("code", "OK");
        res.put("message", "成功");
        res.put("traceId", ApiErrors.newTraceId());
        res.put("retryable", false);
        if (data != null) {
            if (data instanceof Map) {
                res.putAll((Map<String, Object>) data);
            } else {
                res.put("data", data);
            }
        }
        return res;
    }

    /** 成功但带自定义 code（兼容旧前端所有用 success 的地方） */
    public static Map<String, Object> ok(Map<String, Object> payload) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("code", "OK");
        res.put("message", "成功");
        res.put("traceId", ApiErrors.newTraceId());
        res.put("retryable", false);
        res.putAll(payload);
        return res;
    }

    public static Map<String, Object> fail(String errorCode, String message, boolean retryable) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("code", errorCode);
        res.put("message", message);
        res.put("traceId", ApiErrors.newTraceId());
        res.put("retryable", retryable);
        return res;
    }

    public static Map<String, Object> fail(String errorCode, String message, boolean retryable,
                                            List<Map<String, Object>> issues) {
        Map<String, Object> res = fail(errorCode, message, retryable);
        res.put("issues", issues);
        return res;
    }

    /** 构造一个 validation issue（对标 zod issue 结构） */
    public static Map<String, Object> issue(String field, String reason) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("field", field);
        m.put("message", reason);
        return m;
    }

    private ApiResponse() {}
}
