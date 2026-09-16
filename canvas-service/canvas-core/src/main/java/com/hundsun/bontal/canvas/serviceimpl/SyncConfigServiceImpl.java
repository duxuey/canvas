package com.hundsun.bontal.canvas.serviceimpl;

import com.hundsun.bontal.canvas.service.SyncConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 同步配置服务实现 —— 配置存 tb_sync_config（单行，c_pk_id='single'）。
 */
@Service
@Slf4j
public class SyncConfigServiceImpl implements SyncConfigService {

    private final JdbcTemplate canvas;

    public SyncConfigServiceImpl(@Qualifier("defaultJdbcTemplate") JdbcTemplate defaultJdbcTemplate) {
        this.canvas = defaultJdbcTemplate;
    }

    @Override
    public Map<String, Object> getConfig() {
        List<Map<String, Object>> rows = canvas.queryForList(
                "SELECT c_enabled, n_pull_interval, n_push_interval FROM tb_sync_config WHERE c_pk_id = 'single'");
        Map<String, Object> result = new HashMap<>();
        if (rows.isEmpty()) {
            result.put("enabled", false);
            result.put("pullInterval", 300000);
            result.put("pushInterval", 600000);
            return result;
        }
        Map<String, Object> row = rows.get(0);
        result.put("enabled", "1".equals(str(row, "c_enabled")));
        result.put("pullInterval", toInt(row, "n_pull_interval"));
        result.put("pushInterval", toInt(row, "n_push_interval"));
        return result;
    }

    @Override
    public void saveConfig(boolean enabled, int pullInterval, int pushInterval) {
        int e = enabled ? 1 : 0;
        canvas.update(
                "UPDATE tb_sync_config SET c_enabled = ?, n_pull_interval = ?, n_push_interval = ?, d_uptr_time = NOW() WHERE c_pk_id = 'single'",
                String.valueOf(e), pullInterval, pushInterval);
        log.info("同步配置已更新：enabled={}, pullInterval={}, pushInterval={}", enabled, pullInterval, pushInterval);
    }

    @Override
    public boolean isEnabled() {
        Object v = canvas.queryForObject(
                "SELECT c_enabled FROM tb_sync_config WHERE c_pk_id = 'single'", Object.class);
        return v != null && "1".equals(v.toString());
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : v.toString();
    }

    private static int toInt(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return 0;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(v.toString()); } catch (NumberFormatException e) { return 0; }
    }
}
