package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.errors.ApiErrors;
import com.hundsun.bontal.canvas.errors.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常翻译 —— 将原始异常翻译为规范错误信封，禁止泄露内部细节。
 * 对应规范 V1.0 第 3 节 + 红线 9。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<Object> handleDuplicateKey(DuplicateKeyException e) {
        log.warn("重复键冲突 (已翻译)", e);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail("BONTAL_CANVAS_SAVE_ALREADY_EXISTS",
                        "数据重复，请检查唯一标识是否已存在", false));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntime(RuntimeException e) {
        log.error("未预期异常", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("BONTAL_CANVAS_INTERNAL",
                        "服务内部错误", true));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAll(Exception e) {
        log.error("未预期异常", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("BONTAL_CANVAS_INTERNAL",
                        "服务内部错误", true));
    }
}
