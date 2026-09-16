package com.hundsun.bontal.canvas.serviceimpl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.hundsun.bontal.canvas.service.ProdCanvasSyncService;
import com.hundsun.bontal.canvas.service.SyncConfigService;
import com.hundsun.ta.utils.SnowflakeIdWorker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.PeriodicTrigger;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.sql.Timestamp;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * 画布系统 <-> 产品工厂（fpic_prod_db）双向同步实现。
 *
 * <p>开关由 {@link SyncConfigService} 动态读取（tb_sync_config 表），
 * 定时任务用 {@link TaskScheduler} 动态调度，修改配置后立即生效。</p>
 *
 * <p>字段映射：画布字段 <-> 产品工厂字段（生产版命名），与 {@code sync/SyncTool.java} 保持一致。</p>
 */
@Service
@Slf4j
public class ProdCanvasSyncServiceImpl implements ProdCanvasSyncService {

    private final JdbcTemplate prod;      // 产品工厂数据源
    private final JdbcTemplate canvas;    // 画布默认数据源
    private final SyncConfigService syncConfigService;
    private final TaskScheduler taskScheduler;

    private ScheduledFuture<?> pullFuture;
    private ScheduledFuture<?> pushFuture;

    public ProdCanvasSyncServiceImpl(
            @Qualifier("prodJdbcTemplate") JdbcTemplate prodJdbcTemplate,
            @Qualifier("defaultJdbcTemplate") JdbcTemplate defaultJdbcTemplate,
            SyncConfigService syncConfigService,
            TaskScheduler taskScheduler) {
        this.prod = prodJdbcTemplate;
        this.canvas = defaultJdbcTemplate;
        this.syncConfigService = syncConfigService;
        this.taskScheduler = taskScheduler;
    }

    @Override
    public boolean isEnabled() {
        return syncConfigService.isEnabled();
    }

    /** 启动时按配置动态调度两个定时任务 */
    @PostConstruct
    public void initScheduler() {
        scheduleTasks();
    }

    /** 根据 tb_sync_config 里的配置，动态（重）调度拉取/回写任务 */
    public synchronized void scheduleTasks() {
        cancelTasks();
        // 开关关闭时不调度任何定时任务（手动单画布同步不受开关控制）
        if (!isEnabled()) {
            log.info("同步开关关闭，不调度定时任务");
            return;
        }
        Map<String, Object> cfg = syncConfigService.getConfig();
        int pullInterval = ((Number) cfg.get("pullInterval")).intValue();
        int pushInterval = ((Number) cfg.get("pushInterval")).intValue();
        if (pullInterval > 0) {
            pullFuture = taskScheduler.schedule(() -> pullIncremental(),
                    new PeriodicTrigger(pullInterval, TimeUnit.MILLISECONDS));
        }
        if (pushInterval > 0) {
            pushFuture = taskScheduler.schedule(() -> pushAll(),
                    new PeriodicTrigger(pushInterval, TimeUnit.MILLISECONDS));
        }
        log.info("同步定时任务已调度：pullInterval={}ms, pushInterval={}ms", pullInterval, pushInterval);
    }

    private void cancelTasks() {
        if (pullFuture != null) { pullFuture.cancel(false); pullFuture = null; }
        if (pushFuture != null) { pushFuture.cancel(false); pushFuture = null; }
    }

    // ------------------------------------------------------------------
    // PUSH：画布 -> 产品工厂（保存/删除/复制画布后回写）
    // ------------------------------------------------------------------

    @Override
    public int pushCanvas(String canvasCode) {
        // 单画布同步：实时执行，不受系统「全量同步」开关控制
        if (canvasCode == null || canvasCode.isEmpty()) {
            throw new RuntimeException("画布代码不能为空");
        }
        Date start = new Date();
        try {
            Map<String, Object> c = queryOne(canvas,
                    "SELECT * FROM tb_canvas WHERE c_canvas_code = ?", canvasCode);
            if (c == null) {
                record("PUSH", "tb_canvas", 0, start, "SKIPPED", "画布不存在: " + canvasCode);
                throw new RuntimeException("画布不存在: " + canvasCode);
            }
            int n = pushCanvasInternal(c);
            record("PUSH", "tb_canvas", n, start, "SUCCESS", "回写组件数=" + n);
            return n;
        } catch (RuntimeException e) {
            // 保留原始业务错误（画布不存在等），记录日志后向上抛出，让 controller 返回真实失败原因
            log.error("回写画布 {} 到产品工厂失败: {}", canvasCode, e.getMessage());
            record("PUSH", "tb_canvas", 0, start, "FAILED", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("回写画布 {} 到产品工厂失败: {}", canvasCode, e.getMessage(), e);
            record("PUSH", "tb_canvas", 0, start, "FAILED", e.getMessage());
            throw new RuntimeException("同步失败: " + e.getMessage(), e);
        }
    }

    // 防止定时任务重入（上一个 pushAll 未完成时不启动新的）
    private final java.util.concurrent.atomic.AtomicBoolean pushing = new java.util.concurrent.atomic.AtomicBoolean(false);

    @Override
    public int pushAll() {
        if (!isEnabled()) {
            log.debug("同步开关关闭，跳过批量回写");
            return 0;
        }
        if (!pushing.compareAndSet(false, true)) {
            log.warn("上一次批量回写尚未完成，跳过本次定时触发");
            return 0;
        }
        try {
            List<Map<String, Object>> canvases = canvas.queryForList(
                    "SELECT c_canvas_code FROM tb_canvas ORDER BY c_canvas_code");
            int success = 0;
            for (Map<String, Object> c : canvases) {
                String code = str(c, "c_canvas_code");
                try {
                    pushCanvas(code);
                    success++;
                } catch (Exception e) {
                    log.error("批量回写画布 {} 失败: {}", code, e.getMessage());
                }
            }
            log.info("批量回写完成：{} / {} 个画布成功", success, canvases.size());
            return success;
        } finally {
            pushing.set(false);
        }
    }

    @Override
    public void pushDelete(String canvasCode) {
        // 删除不同步（用户决策 2）：仅记录，不删除产品工厂数据
        log.info("画布 {} 删除不同步产品工厂（按决策：删除不同步）", canvasCode);
    }

    /**
     * 核心：把画布（三层模型）反向回写到产品工厂。
     * 解析画布 JSON 的 items[]，每个 component 对应一个产品工厂 screen。
     */
    private int pushCanvasInternal(Map<String, Object> c) {
        String canvasCode = str(c, "c_canvas_code");
        String canvasJson = str(c, "c_canvas_json");
        if (canvasJson == null || canvasJson.isEmpty()) {
            return 0;
        }
        // 解析产品号 + contentType（c_canvas_code 形如 "01003_1"）
        String prodNo;
        String contentType;
        int idx = canvasCode.indexOf('_');
        if (idx > 0) {
            prodNo = canvasCode.substring(0, idx);
            contentType = canvasCode.substring(idx + 1);
        } else {
            prodNo = canvasCode;
            contentType = "1";
        }
        // 反查产品上下文（版本/渠道）
        Map<String, Object> prodCtx = queryOne(prod,
                "SELECT c_prod_no, c_version, c_chnl_code FROM tb_prod_rel_screen WHERE c_prod_no = ? LIMIT 1",
                prodNo);
        String version = prodCtx != null ? str(prodCtx, "c_version") : "v1";
        String chnlCode = prodCtx != null ? str(prodCtx, "c_chnl_code") : "CA01";

        JSONObject root;
        try {
            root = JSON.parseObject(canvasJson);
        } catch (Exception e) {
            log.warn("画布 {} JSON 解析失败: {}", canvasCode, e.getMessage());
            return 0;
        }
        JSONArray items = root.getJSONArray("items");
        if (items == null || items.isEmpty()) {
            return 0;
        }

        int n = 0;
        boolean changed = false;
        for (int i = 0; i < items.size(); i++) {
            JSONObject item = items.getJSONObject(i);
            if (!"component".equals(item.getString("itemType"))) {
                continue; // 只同步组件，跳过 section/table/自由元件等
            }
            String refCode = item.getString("refCode");
            String refName = item.getString("refName");
            int compColumns = item.getIntValue("compColumns");
            if (compColumns <= 0) compColumns = 1;
            JSONArray childElements = item.getJSONArray("childElements");

            // 确定 screen_no：refCode 在产品工厂不存在则新增（产品号+序号）
            String screenNo = resolveScreenNo(refCode, prodNo);
            if (!screenNo.equals(refCode)) {
                // 新增：把新编号写回画布 JSON 的 refCode，并更新组件库 group_code
                item.put("refCode", screenNo);
                changed = true;
                canvas.update("UPDATE tb_element_group SET c_group_code = ?, c_group_tag = ? WHERE c_group_code = ?",
                        screenNo, prodNo, refCode);
            }

            // 回写/新增 screen
            upsertScreen(screenNo, prodNo, version, chnlCode, contentType, refName, compColumns);
            // 回写元件
            if (childElements != null) {
                upsertElements(screenNo, prodNo, version, chnlCode, childElements);
            }
            n++;
        }
        // 若有新增 screen，更新画布 JSON 持久化 refCode
        if (changed) {
            canvas.update("UPDATE tb_canvas SET c_canvas_json = ? WHERE c_canvas_code = ?",
                    root.toJSONString(), canvasCode);
        }
        return n;
    }

    /** 确定 screen_no：refCode 已存在则直接用，否则生成「产品号+序号」新编号 */
    private String resolveScreenNo(String refCode, String prodNo) {
        if (refCode == null || refCode.isEmpty()) {
            return generateScreenNo(prodNo);
        }
        Integer cnt = prod.queryForObject(
                "SELECT COUNT(*) FROM tb_prod_rel_screen WHERE c_screen_no = ?", Integer.class, refCode);
        if (cnt != null && cnt > 0) {
            return refCode; // 已存在，直接更新
        }
        return generateScreenNo(prodNo); // 新增
    }

    /** 生成「产品号 + 3位序号」的可读 screen_no，如 01003 -> 01003001 */
    private String generateScreenNo(String prodNo) {
        List<Map<String, Object>> rows = prod.queryForList(
                "SELECT c_screen_no FROM tb_prod_rel_screen WHERE c_screen_no LIKE ? ORDER BY c_screen_no DESC LIMIT 1",
                prodNo + "%");
        int seq = 1;
        if (!rows.isEmpty()) {
            String last = str(rows.get(0), "c_screen_no");
            String suffix = last.substring(prodNo.length());
            try {
                seq = Integer.parseInt(suffix) + 1;
            } catch (NumberFormatException e) {
                seq = 1;
            }
        }
        return prodNo + String.format("%03d", seq);
    }

    /** upsert screen（tb_prod_rel_screen）：先 UPDATE，影响 0 行则 INSERT，避免先 COUNT */
    private void upsertScreen(String screenNo, String prodNo, String version, String chnlCode,
                              String contentType, String screenName, int columns) {
        int updated = prod.update(
                "UPDATE tb_prod_rel_screen SET c_screen_cname = ?, c_screen_content_type = ?, "
                        + "c_uptr_code = ?, d_uptr_time = ? WHERE c_screen_no = ?",
                screenName, contentType, "canvas", new Timestamp(System.currentTimeMillis()), screenNo);
        if (updated == 0) {
            prod.update(
                    "INSERT INTO tb_prod_rel_screen (n_pk_id, c_screen_no, c_prod_no, c_screen_cname, c_screen_ename, "
                            + "n_show_order, c_rel_js_file, d_crtr_time, d_uptr_time, c_crtr_code, c_uptr_code, "
                            + "c_base_comp_flag, c_screen_json, c_chnl_code, c_version, c_screen_content_type, c_remark) "
                            + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    SnowflakeIdWorker.getId(), screenNo, prodNo, screenName, "",
                    0, null, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()),
                    "canvas", "canvas", "0", null, chnlCode, version, contentType, null);
        }
        // 属性表（tb_prod_screen_prop）也 upsert 列数
        upsertScreenProp(screenNo, prodNo, version, chnlCode, screenName, columns);
    }

    /** upsert screen 属性（tb_prod_screen_prop）：先 UPDATE，影响 0 行则 INSERT */
    private void upsertScreenProp(String screenNo, String prodNo, String version, String chnlCode,
                                  String screenName, int columns) {
        int updated = prod.update(
                "UPDATE tb_prod_screen_prop SET n_columns = ?, c_screen_cname = ?, c_uptr_code = ?, d_uptr_time = ? WHERE c_screen_no = ?",
                columns, screenName, "canvas", new Timestamp(System.currentTimeMillis()), screenNo);
        if (updated == 0) {
            prod.update(
                    "INSERT INTO tb_prod_screen_prop (n_pk_id, c_prod_no, c_screen_no, c_screen_cname, c_screen_ename, "
                            + "n_columns, c_btn_layout, c_screen_type, d_crtr_time, d_uptr_time, c_crtr_code, c_uptr_code, "
                            + "c_chnl_code, c_version, c_screen_content_type) "
                            + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    SnowflakeIdWorker.getId(), prodNo, screenNo, screenName, "", columns, "center", "form",
                    new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()),
                    "canvas", "canvas", chnlCode, version, "1");
        }
    }

    /** upsert 元件（tb_prod_screen_rel_elem）：先一次性查出该 screen 已存在的 elem_no，避免逐条 COUNT */
    private void upsertElements(String screenNo, String prodNo, String version, String chnlCode,
                                JSONArray childElements) {
        // 一次性查出该 screen 已存在的 elem_no 集合
        Set<String> existingElems = new HashSet<>();
        List<Map<String, Object>> existingRows = prod.queryForList(
                "SELECT c_elem_no FROM tb_prod_screen_rel_elem WHERE c_screen_no = ?", screenNo);
        for (Map<String, Object> row : existingRows) {
            Object v = row.get("c_elem_no");
            if (v != null) existingElems.add(v.toString());
        }

        for (int i = 0; i < childElements.size(); i++) {
            JSONObject el = childElements.getJSONObject(i);
            String elemNo = el.getString("elem_code");
            if (elemNo == null || elemNo.isEmpty()) continue;

            if (existingElems.contains(elemNo)) {
                prod.update(
                        "UPDATE tb_prod_screen_rel_elem SET c_contrl_type = ?, c_must_input_flag = ?, "
                                + "c_read_only_flag = ?, c_view_show_flag = ?, c_default_value = ?, c_status = ?, "
                                + "n_mini_value = ?, n_maxi_value = ?, c_codelist_id = ?, n_string_length = ?, "
                                + "n_elem_show_seq_no = ?, c_elem_cname = ?, c_elem_ename = ?, c_rel_field_name = ?, "
                                + "c_rel_table_name = ?, c_contrl_attr = ?, c_check_type = ?, c_title = ?, "
                                + "c_uptr_code = ?, d_uptr_time = ? WHERE c_screen_no = ? AND c_elem_no = ?",
                        el.getString("control_type"),
                        el.getString("required_flag"),
                        el.getString("readonly_flag"),
                        el.getString("visible_flag"),
                        el.getString("default_value"),
                        el.getString("enabled_flag"),
                        el.getInteger("min_value"),
                        el.getInteger("max_value"),
                        el.getString("code_list_name"),
                        el.getInteger("string_length"),
                        i + 1,
                        el.getString("elem_name"),
                        el.getString("elem_ename"),
                        el.getString("rel_field_name"),
                        el.getString("rel_table_name"),
                        el.getString("control_attr"),
                        sanitizeCheckType(el.getString("check_type")),
                        el.getString("tooltip_title"),
                        "canvas",
                        new Timestamp(System.currentTimeMillis()),
                        screenNo, elemNo);
            } else {
                prod.update(
                        "INSERT INTO tb_prod_screen_rel_elem (n_pk_id, c_screen_no, c_elem_no, c_contrl_type, "
                                + "c_check_type, c_must_input_flag, c_read_only_flag, c_view_show_flag, c_default_value, "
                                + "c_status, n_mini_value, n_maxi_value, c_codelist_id, n_string_length, "
                                + "n_elem_show_seq_no, c_elem_cname, c_elem_ename, c_rel_field_name, c_rel_table_name, "
                                + "c_contrl_attr, c_title, c_prod_no, c_version, c_chnl_code, c_crtr_code, c_uptr_code, "
                                + "d_crtr_time, d_uptr_time) "
                                + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        SnowflakeIdWorker.getId(), screenNo, elemNo,
                        el.getString("control_type"), sanitizeCheckType(el.getString("check_type")),
                        el.getString("required_flag"), el.getString("readonly_flag"),
                        el.getString("visible_flag"), el.getString("default_value"),
                        el.getString("enabled_flag"), el.getInteger("min_value"), el.getInteger("max_value"),
                        el.getString("code_list_name"), el.getInteger("string_length"),
                        i + 1, el.getString("elem_name"), el.getString("elem_ename"),
                        el.getString("rel_field_name"), el.getString("rel_table_name"),
                        el.getString("control_attr"), el.getString("tooltip_title"),
                        prodNo, version, chnlCode, "canvas", "canvas",
                        new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));
            }
        }
    }

    /**
     * 处理 check_type：产品工厂 c_check_type 是 varchar(3)，
     * 画布系统的 "none"（4字符）等值需转为 null，超长值截断，避免 Data too long。
     */
    private String sanitizeCheckType(String v) {
        if (v == null) return null;
        String s = v.trim();
        if (s.isEmpty() || "none".equalsIgnoreCase(s) || "null".equalsIgnoreCase(s)) {
            return null;
        }
        return s.length() > 3 ? s.substring(0, 3) : s;
    }


    // ------------------------------------------------------------------
    // PULL：产品工厂 -> 画布（增量，按 d_uptr_time）
    // ------------------------------------------------------------------

    @Override
    public void pullIncremental() {
        if (!isEnabled()) {
            log.debug("同步开关关闭，跳过拉取同步");
            return;
        }
        Date start = new Date();
        Timestamp since = lastSyncTime();
        try {
            int nScreen = pullScreens(since);
            int nElem = pullElements(since);
            int nProp = pullConfigs(since);
            record("PULL", "tb_canvas", nScreen, start, "SUCCESS", "since=" + since);
            record("PULL", "tb_canvas_element", nElem, start, "SUCCESS", "since=" + since);
            record("PULL", "tb_canvas_config", nProp, start, "SUCCESS", "since=" + since);
        } catch (Exception e) {
            log.error("拉取同步失败: {}", e.getMessage(), e);
            record("PULL", "tb_canvas", 0, start, "FAILED", e.getMessage());
        }
    }

    private int pullScreens(Timestamp since) {
        List<Map<String, Object>> rows = prod.queryForList(
                "SELECT * FROM tb_prod_rel_screen WHERE d_uptr_time > ?", since);
        for (Map<String, Object> r : rows) {
            String screenNo = str(r, "c_screen_no");
            String type = str(r, "c_screen_content_type");
            canvas.update(
                    "INSERT INTO tb_canvas (c_pk_id, c_canvas_code, c_canvas_name, c_canvas_ename, c_canvas_type, "
                            + "c_canvas_json, n_show_order, c_rel_js_file, c_base_flag, c_system_code, c_remark, "
                            + "c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time) "
                            + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
                            + "ON DUPLICATE KEY UPDATE c_canvas_name = VALUES(c_canvas_name), "
                            + "c_canvas_ename = VALUES(c_canvas_ename), c_canvas_type = VALUES(c_canvas_type), "
                            + "c_canvas_json = VALUES(c_canvas_json), n_show_order = VALUES(n_show_order), "
                            + "c_rel_js_file = VALUES(c_rel_js_file), c_base_flag = VALUES(c_base_flag), "
                            + "c_remark = VALUES(c_remark), d_uptr_time = VALUES(d_uptr_time)",
                    SnowflakeIdWorker.getId(), screenNo, str(r, "c_screen_cname"), str(r, "c_screen_ename"),
                    type, str(r, "c_screen_json"), toInt(r, "n_show_order"), str(r, "c_rel_js_file"),
                    str(r, "c_base_comp_flag"), "SYS01", str(r, "c_remark"),
                    str(r, "c_crtr_code"), str(r, "c_uptr_code"), str(r, "d_crtr_time"), str(r, "d_uptr_time"));
        }
        return rows.size();
    }

    private int pullElements(Timestamp since) {
        List<Map<String, Object>> rows = prod.queryForList(
                "SELECT * FROM tb_prod_screen_rel_elem WHERE d_uptr_time > ?", since);
        for (Map<String, Object> r : rows) {
            String screenNo = str(r, "c_screen_no");
            String elemNo = str(r, "c_elem_no");
            canvas.update(
                    "INSERT INTO tb_canvas_element (c_pk_id, c_canvas_code, c_elem_code, c_elem_name, c_elem_ename, "
                            + "c_control_type, c_check_type, c_required_flag, c_readonly_flag, c_visible_flag, c_default_value, "
                            + "c_enabled_flag, c_min_value, c_max_value, c_precision, c_code_list_name, n_string_length, "
                            + "c_click_event_func, c_comp_code, n_elem_show_seq, c_rel_field_name, c_rel_table_name, "
                            + "c_control_attr, c_date_format, c_frontend_event, c_readonly_var, c_valid_control_attr, "
                            + "c_group_flag, c_group_first_item, c_client_group, c_auto_select_first, c_tooltip_title, "
                            + "c_search_url, c_search_param_key, c_search_result_key, c_search_select_event, c_system_code, "
                            + "c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time) "
                            + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
                            + "ON DUPLICATE KEY UPDATE c_elem_name = VALUES(c_elem_name), c_elem_ename = VALUES(c_elem_ename), "
                            + "c_control_type = VALUES(c_control_type), c_required_flag = VALUES(c_required_flag), "
                            + "c_readonly_flag = VALUES(c_readonly_flag), c_visible_flag = VALUES(c_visible_flag), "
                            + "c_default_value = VALUES(c_default_value), c_enabled_flag = VALUES(c_enabled_flag), "
                            + "d_uptr_time = VALUES(d_uptr_time)",
                    SnowflakeIdWorker.getId(), screenNo, elemNo, str(r, "c_elem_cname"), str(r, "c_elem_ename"),
                    str(r, "c_contrl_type"), str(r, "c_check_type"), str(r, "c_must_input_flag"),
                    str(r, "c_read_only_flag"), str(r, "c_view_show_flag"), str(r, "c_default_value"),
                    str(r, "c_status"), toInt(r, "n_mini_value"), toInt(r, "n_maxi_value"),
                    toInt(r, "n_precision_val"), str(r, "c_codelist_id"), toInt(r, "n_string_length"),
                    str(r, "c_click_event_func"), str(r, "c_comp_code"), r.get("n_elem_show_seq_no"),
                    str(r, "c_rel_field_name"), str(r, "c_rel_table_name"), str(r, "c_contrl_attr"),
                    str(r, "c_date_format"), str(r, "c_frontend_event_func"), str(r, "c_read_only_var"),
                    str(r, "c_valid_item_contrl_attr"), str(r, "c_group_flag"), str(r, "c_group_first_item"),
                    str(r, "c_clnt_group"), str(r, "c_default_dropdown_flag"), str(r, "c_title"),
                    str(r, "c_search_url"), str(r, "c_search_param_key"), str(r, "c_search_result_key"),
                    str(r, "c_search_select_event"), "SYS01", str(r, "c_crtr_code"), str(r, "c_uptr_code"),
                    str(r, "d_crtr_time"), str(r, "d_uptr_time"));
        }
        return rows.size();
    }

    private int pullConfigs(Timestamp since) {
        List<Map<String, Object>> rows = prod.queryForList(
                "SELECT * FROM tb_prod_screen_prop WHERE d_uptr_time > ?", since);
        for (Map<String, Object> r : rows) {
            canvas.update(
                    "INSERT INTO tb_canvas_config (c_pk_id, c_canvas_code, c_canvas_name, c_canvas_ename, c_canvas_type, "
                            + "n_columns, c_buttons_layout, c_modify_func, c_calc_envelop_func, c_save_envelop_func, "
                            + "c_query_envelop_func, c_add_event_func, c_delete_event_func, c_create_event_func, c_verify_valid_func, "
                            + "c_add_control_attr, c_delete_control_attr, c_oprt_type, c_oprt_button, c_comp_flag, "
                            + "c_sql_searchsql, c_sql_insertsql, c_table_default_info, c_system_code, "
                            + "c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time) "
                            + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
                            + "ON DUPLICATE KEY UPDATE c_canvas_name = VALUES(c_canvas_name), "
                            + "c_canvas_ename = VALUES(c_canvas_ename), c_canvas_type = VALUES(c_canvas_type), "
                            + "n_columns = VALUES(n_columns), c_buttons_layout = VALUES(c_buttons_layout), "
                            + "d_uptr_time = VALUES(d_uptr_time)",
                    SnowflakeIdWorker.getId(), str(r, "c_screen_no"), str(r, "c_screen_cname"),
                    str(r, "c_screen_ename"), str(r, "c_screen_type"), toInt(r, "n_columns"),
                    str(r, "c_btn_layout"), str(r, "c_modify_func"), str(r, "c_calc_func"),
                    str(r, "c_save_func"), str(r, "c_query_envelop_func"), str(r, "c_add_event_func"),
                    str(r, "c_delete_event_func"), str(r, "c_create_event_func"), str(r, "c_verify_valid_func"),
                    str(r, "c_add_button_attr"), str(r, "c_delete_button_attr"), str(r, "c_oprt_type"),
                    str(r, "c_oprt_button"), str(r, "c_comp_flag"), str(r, "c_sql_query"),
                    str(r, "c_sql_insert"), str(r, "c_table_default_info"), "SYS01",
                    str(r, "c_crtr_code"), str(r, "c_uptr_code"), str(r, "d_crtr_time"), str(r, "d_uptr_time"));
        }
        return rows.size();
    }

    // ------------------------------------------------------------------
    // 辅助
    // ------------------------------------------------------------------

    private Timestamp lastSyncTime() {
        List<Map<String, Object>> rows = canvas.queryForList(
                "SELECT MAX(d_end_time) AS t FROM tb_canvas_sync_log WHERE c_direction = 'PULL' AND c_status = 'SUCCESS'");
        if (rows.isEmpty() || rows.get(0).get("t") == null) {
            return new Timestamp(0L);
        }
        Object t = rows.get(0).get("t");
        if (t instanceof Timestamp) {
            return (Timestamp) t;
        }
        return Timestamp.valueOf(t.toString());
    }

    private void record(String direction, String table, int rowCount, Date start, String status, String msg) {
        try {
            canvas.update(
                    "INSERT INTO tb_canvas_sync_log (c_pk_id, c_direction, c_table_name, n_row_count, "
                            + "d_start_time, d_end_time, c_status, c_message, d_crtr_time) VALUES (?,?,?,?,?,?,?,?,?)",
                    String.valueOf(SnowflakeIdWorker.getId()), direction, table, rowCount,
                    new Timestamp(start.getTime()), new Timestamp(System.currentTimeMillis()), status, msg,
                    new Timestamp(System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("写同步日志失败: {}", e.getMessage());
        }
    }

    private Map<String, Object> queryOne(JdbcTemplate jdbc, String sql, Object... args) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, args);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : v.toString();
    }

    private static Integer toInt(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).intValue();
        return Integer.valueOf(v.toString());
    }
}
