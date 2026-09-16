package com.hundsun.bontal.canvas.errors;

import java.util.UUID;

/**
 * 规范错误码（四段式：域_服务_场景_原因）。
 * 对应规范 V1.0 第 3 节。
 */
public final class ApiErrors {

    // ──── 域 ────
    private static final String DOMAIN = "BONTAL";
    // ──── 服务 ────
    private static final String SVC_CANVAS = "CANVAS";
    private static final String SVC_ELEMDEF = "ELEMDEF";
    private static final String SVC_GRP = "ELEMGRP";
    private static final String SVC_TPL = "TEMPLATE";

    // ──── 通用 ────
    public static final String NOT_FOUND = "%s_%s_QUERY_NOT_FOUND";
    public static final String INVALID_INPUT = "%s_%s_SAVE_INVALID_INPUT";
    public static final String ALREADY_EXISTS = "%s_%s_SAVE_ALREADY_EXISTS";
    public static final String DELETE_FAILED = "%s_%s_DELETE_NOT_FOUND";
    public static final String INTERNAL = "%s_%s_INTERNAL";

    // ──── 预组合 ────
    public static final String CANVAS_NOT_FOUND = String.format(NOT_FOUND, DOMAIN, SVC_CANVAS);
    public static final String CANVAS_INVALID = String.format(INVALID_INPUT, DOMAIN, SVC_CANVAS);

    public static final String ELEMDEF_NOT_FOUND = String.format(NOT_FOUND, DOMAIN, SVC_ELEMDEF);
    public static final String ELEMDEF_INVALID = String.format(INVALID_INPUT, DOMAIN, SVC_ELEMDEF);

    public static final String GRP_NOT_FOUND = String.format(NOT_FOUND, DOMAIN, SVC_GRP);
    public static final String GRP_INVALID = String.format(INVALID_INPUT, DOMAIN, SVC_GRP);

    public static final String TPL_NOT_FOUND = String.format(NOT_FOUND, DOMAIN, SVC_TPL);
    public static final String TPL_INVALID = String.format(INVALID_INPUT, DOMAIN, SVC_TPL);

    // ──── 工具 ────
    /** 生成本次请求的 traceId（ULID 近似：timestamp + random） */
    public static String newTraceId() {
        return String.format("%013d-%s",
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8));
    }

    private ApiErrors() {}
}
