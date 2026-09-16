package com.hundsun.bontal.canvas.service;

import java.util.Map;

/**
 * 同步配置服务 —— 界面化开关管理。
 * 配置存 tb_sync_config 表（单行），支持运行时动态读取与修改。
 */
public interface SyncConfigService {

    /**
     * 查询当前同步配置。
     * @return { enabled, pullInterval, pushInterval }
     */
    Map<String, Object> getConfig();

    /**
     * 保存同步配置（修改后立即生效，动态重调度定时任务）。
     * @param enabled 同步总开关 true/false
     * @param pullInterval 拉取间隔（毫秒）
     * @param pushInterval 回写间隔（毫秒）
     */
    void saveConfig(boolean enabled, int pullInterval, int pushInterval);

    /**
     * 同步开关是否开启（供同步服务动态判断）。
     */
    boolean isEnabled();
}
