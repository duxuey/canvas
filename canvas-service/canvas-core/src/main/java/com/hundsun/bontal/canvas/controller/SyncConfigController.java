package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.service.SyncConfigService;
import com.hundsun.bontal.canvas.serviceimpl.ProdCanvasSyncServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 同步配置管理接口 —— 界面化开关 + 频率设置。
 */
@RestController
@RequestMapping("/sync_config")
public class SyncConfigController {

    @Autowired
    private SyncConfigService syncConfigService;

    @Autowired
    private ProdCanvasSyncServiceImpl prodCanvasSyncService;

    /** 查询同步配置 */
    @PostMapping("/get")
    public Map<String, Object> getConfig() {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", syncConfigService.getConfig());
        return result;
    }

    /** 保存同步配置（保存后立即重调度定时任务） */
    @PostMapping("/save")
    public Map<String, Object> saveConfig(@RequestBody Map<String, Object> input) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean enabled = Boolean.parseBoolean(String.valueOf(input.getOrDefault("enabled", false)));
            int pullInterval = toInt(input.get("pullInterval"), 300000);
            int pushInterval = toInt(input.get("pushInterval"), 600000);
            syncConfigService.saveConfig(enabled, pullInterval, pushInterval);
            // 保存后动态重调度定时任务，使开关/频率立即生效
            prodCanvasSyncService.scheduleTasks();
            result.put("success", true);
            result.put("message", "同步配置已保存");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "保存失败: " + e.getMessage());
        }
        return result;
    }

    private int toInt(Object v, int def) {
        if (v == null) return def;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(v.toString()); } catch (NumberFormatException e) { return def; }
    }
}
