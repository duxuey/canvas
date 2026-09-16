package com.hundsun.bontal.canvas.serviceimpl;

import com.alibaba.fastjson.JSON;
import com.hundsun.bontal.canvas.dao.*;
import com.hundsun.bontal.canvas.engine.CanvasComponent;
import com.hundsun.bontal.canvas.engine.CanvasElemVO;
import com.hundsun.bontal.canvas.engine.CanvasJsonParser;
import com.hundsun.bontal.canvas.errors.CanvasErrors;
import com.hundsun.bontal.canvas.model.*;
import com.hundsun.bontal.canvas.service.CanvasService;
import com.hundsun.bontal.common.exception.LttsBusinessException;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import com.hundsun.ta.utils.SnowflakeIdWorker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * 画布核心服务实现 (from ProdRelScreenServiceImpl)
 */
@Service
@Slf4j
public class CanvasServiceImpl extends BusinessMinService implements CanvasService {

    @Override
    @Transactional
    public void saveCanvas(saveCanvas.Input input, saveCanvas.Output output) {
        String canvasCode = input.getCanvasCode();
        boolean isNew = (canvasCode == null || canvasCode.isEmpty());

        if (isNew) {
            canvasCode = String.valueOf(SnowflakeIdWorker.getId());
        }

        Canvas canvas = new Canvas();
        canvas.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
        canvas.setC_canvas_code(canvasCode);
        canvas.setC_canvas_name(input.getCanvasName());
        canvas.setC_canvas_ename(input.getCanvasEname());
        canvas.setC_canvas_type(input.getCanvasType());
        canvas.setC_canvas_json(input.getCanvasJson());
        canvas.setN_show_order(input.getShowOrder() != null ? input.getShowOrder() : 0);
        canvas.setC_rel_js_file(input.getRelJsFile());
        canvas.setC_base_flag(input.getBaseFlag());
        canvas.setC_system_code(input.getSystemCode());
        canvas.setC_page_code(input.getPageCode());
        canvas.setC_template_code(input.getTemplateCode());

        Date now = new Date();
        if (isNew) {
            canvas.setD_crtr_time(now);
            canvas.setD_uptr_time(now);
            CanvasDao.insert(canvas);
        } else {
            // Check if exists
            Canvas existing = CanvasDao.selectByCanvasCode(canvasCode, false);
            if (existing != null) {
                canvas.setC_pk_id(existing.getC_pk_id());
                canvas.setD_uptr_time(now);
                CanvasDao.updateByCanvasCode(canvas);
            } else {
                canvas.setD_crtr_time(now);
                canvas.setD_uptr_time(now);
                CanvasDao.insert(canvas);
            }
        }

        // Auto-create page_template record if templateCode is set but doesn't exist
        String tplCode = input.getTemplateCode();
        if (tplCode != null && !tplCode.isEmpty()) {
            PageTemplate existingTpl = PageTemplateDao.selectByTemplateCode(tplCode, false);
            if (existingTpl == null) {
                PageTemplate tpl = new PageTemplate();
                tpl.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
                tpl.setC_template_code(tplCode);
                tpl.setC_template_name(input.getCanvasName() + "模板");
                tpl.setC_template_desc("自动创建（来自画布保存）");
                tpl.setC_template_type("page");
                tpl.setC_system_code(input.getSystemCode());
                tpl.setC_del_flag("0");
                PageTemplateDao.insert(tpl);
            }
        }
        output.setCanvasCode(canvasCode);

        // 注意：不再自动回写产品工厂，改为「手动同步按钮」或「定时同步」触发
    }

    @Override
    @Transactional
    public void deleteCanvas(deleteCanvas.Input input, deleteCanvas.Output output) {
        String canvasCode = input.getCanvasCode();
        if (canvasCode == null || canvasCode.isEmpty()) {
            throw CanvasErrors.canvasNotFound("null");
        }
        // Cascade delete: elements + config + canvas
        CanvasElementDao.deleteByCanvasCode(canvasCode);
        CanvasConfigDao.deleteByCanvasCode(canvasCode);
        CanvasDao.deleteByCanvasCode(canvasCode);

        // 删除不同步产品工厂（决策：删除不同步）
    }

    @Override
    public void queryByPage(queryByPage.Input input, queryByPage.Output output) {
        // 先按 systemCode 拉全量，再在内存中过滤 + 分页（数据量小，避免改动 Mapper）
        List<Canvas> all = CanvasDao.selectBySystem(input.getSystemCode());

        String type = input.getCanvasType();
        String keyword = input.getKeyword();
        String pageCode = input.getPageCode();

        List<Canvas> filtered = new ArrayList<>();
        for (Canvas c : all) {
            if (pageCode != null && !pageCode.isEmpty()
                    && !pageCode.equals(c.getC_page_code())) {
                continue;
            }
            if (type != null && !type.isEmpty()
                    && !type.equals(c.getC_canvas_type())) {
                continue;
            }
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = keyword.trim();
                boolean hit = (c.getC_canvas_name() != null && c.getC_canvas_name().contains(kw))
                        || (c.getC_canvas_code() != null && c.getC_canvas_code().contains(kw));
                if (!hit) continue;
            }
            filtered.add(c);
        }

        // 按显示顺序排序
        filtered.sort(Comparator.comparing(c -> c.getN_show_order() == null ? 0 : c.getN_show_order()));

        // 分页
        int pageNum = Math.max(1, input.getPageNum());
        int pageSize = input.getPageSize() > 0 ? input.getPageSize() : 10;
        int total = filtered.size();
        int from = Math.min((pageNum - 1) * pageSize, total);
        int to = Math.min(from + pageSize, total);
        List<Canvas> pageItems = filtered.subList(from, to);

        List<Map<String, Object>> resultList = new ArrayList<>();
        for (Canvas c : pageItems) {
            resultList.add(BeanUtil.bean2Map(c));
        }

        com.hundsun.bontal.common.dto.Page<List<Map<String, Object>>> resultPage = new com.hundsun.bontal.common.dto.Page<>();
        resultPage.setTotal(total);
        resultPage.setSize(pageSize);
        resultPage.setCurrent(pageNum);
        resultPage.setData(resultList);
        output.setPage(resultPage);
    }

    @Override
    public void queryByCode(queryByCode.Input input, queryByCode.Output output) {
        Canvas canvas = CanvasDao.selectByCanvasCode(input.getCanvasCode(), true);
        output.setCanvas(BeanUtil.bean2Map(canvas));
    }

    @Override
    @Transactional
    public void updateCanvasJson(updateCanvasJson.Input input, updateCanvasJson.Output output) {
        String canvasCode = input.getCanvasCode();
        String canvasJson = input.getCanvasJson();

        if (canvasCode == null || canvasCode.isEmpty()) {
            throw CanvasErrors.canvasNotFound("null");
        }

        // Update the canvas JSON
        Canvas canvas = CanvasDao.selectByCanvasCode(canvasCode, true);
        canvas.setC_canvas_json(canvasJson);
        canvas.setD_uptr_time(new Date());
        CanvasDao.updateJsonByCode(canvas);

        // Parse JSON and extract elements + config
        try {
            CanvasComponent comp = CanvasJsonParser.parseCanvasJson(canvasJson);

            // Save elements
            saveCanvasElements(comp, canvasCode, input.getSystemCode(), input.getPageCode(), canvas.getC_template_code());

            // Save config
            saveCanvasConfig(comp, canvasCode, input.getSystemCode(), canvas.getC_template_code());
        } catch (Exception e) {
            log.error("Failed to parse canvas JSON: {}", e.getMessage(), e);
            throw CanvasErrors.invalidCanvasJson(e.getMessage());
        }

        // 不再自动回写，改为手动/定时同步
    }

    @Override
    public void editCanvas(editCanvas.Input input, editCanvas.Output output) {
        String canvasCode = input.getCanvasCode();
        Canvas canvas = CanvasDao.selectByCanvasCode(canvasCode, true);
        CanvasConfig config = CanvasConfigDao.selectByCanvasCode(canvasCode);
        List<CanvasElement> elements = CanvasElementDao.selectByCanvasCode(canvasCode);

        // Assemble the editable JSON
        Map<String, Object> result = assembleEditableJson(canvas, config, elements);
        output.setCanvasJson(JSON.toJSONString(result));
    }

    @Override
    public void previewCanvas(previewCanvas.Input input, previewCanvas.Output output) {
        String canvasCode = input.getCanvasCode();
        Canvas canvas = CanvasDao.selectByCanvasCode(canvasCode, true);
        output.setPreviewJson(canvas.getC_canvas_json());
    }

    @Override
    @Transactional
    public void copyCanvas(copyCanvas.Input input, copyCanvas.Output output) {
        String sourceCode = input.getSourceCanvasCode();
        Canvas source = CanvasDao.selectByCanvasCode(sourceCode, true);

        // Generate new canvas code
        String newCode;
        do {
            newCode = String.valueOf(SnowflakeIdWorker.getId());
        } while (CanvasDao.selectByCanvasCode(newCode, false) != null);

        // Copy canvas
        Canvas newCanvas = new Canvas();
        newCanvas.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
        newCanvas.setC_canvas_code(newCode);
        newCanvas.setC_canvas_name(input.getTargetCanvasName() != null ? input.getTargetCanvasName() : source.getC_canvas_name() + "-副本");
        newCanvas.setC_canvas_ename(source.getC_canvas_ename());
        newCanvas.setC_canvas_type(source.getC_canvas_type());
        newCanvas.setC_canvas_json(source.getC_canvas_json());
        newCanvas.setN_show_order(source.getN_show_order());
        newCanvas.setC_rel_js_file(source.getC_rel_js_file());
        newCanvas.setC_base_flag(source.getC_base_flag());
        newCanvas.setC_system_code(input.getTargetSystemCode() != null ? input.getTargetSystemCode() : source.getC_system_code());
        newCanvas.setC_page_code(input.getTargetPageCode() != null ? input.getTargetPageCode() : source.getC_page_code());
        newCanvas.setC_template_code(source.getC_template_code());
        newCanvas.setD_crtr_time(new Date());
        newCanvas.setD_uptr_time(new Date());
        CanvasDao.insert(newCanvas);

        // Copy elements
        List<CanvasElement> srcElements = CanvasElementDao.selectByCanvasCode(sourceCode);
        for (CanvasElement se : srcElements) {
            CanvasElement ne = new CanvasElement();
            ne.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            ne.setC_canvas_code(newCode);
            Map<String, Object> seMap = BeanUtil.bean2Map(se);
            // Copy all fields except pk and canvas code
            BeanUtil.map2Bean(seMap, ne);
            ne.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            ne.setC_canvas_code(newCode);
            ne.setC_system_code(newCanvas.getC_system_code());
            CanvasElementDao.insert(ne);
        }

        // Copy config
        CanvasConfig srcConfig = CanvasConfigDao.selectByCanvasCode(sourceCode);
        if (srcConfig != null) {
            CanvasConfig nc = new CanvasConfig();
            nc.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            nc.setC_canvas_code(newCode);
            Map<String, Object> scMap = BeanUtil.bean2Map(srcConfig);
            BeanUtil.map2Bean(scMap, nc);
            nc.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            nc.setC_canvas_code(newCode);
            nc.setC_system_code(newCanvas.getC_system_code());
            CanvasConfigDao.insert(nc);
        }

        output.setNewCanvasCode(newCode);

        // 不再自动回写，改为手动/定时同步
    }

    @Override
    public void queryBySystem(queryBySystem.Input input, queryBySystem.Output output) {
        List<Canvas> list = CanvasDao.selectBySystem(input.getSystemCode());
        List<Map<String, Object>> resultList = new ArrayList<>();
        for (Canvas c : list) {
            resultList.add(BeanUtil.bean2Map(c));
        }
        output.setCanvases(resultList);
    }

    @Override
    public void pagePreview(pagePreview.Input input, pagePreview.Output output) {
        List<Canvas> canvases = CanvasDao.selectBySystemAndPage(input.getSystemCode(), input.getPageCode());
        List<Map<String, Object>> previewList = new ArrayList<>();
        for (Canvas c : canvases) {
            Map<String, Object> item = new HashMap<>();
            item.put("canvasCode", c.getC_canvas_code());
            item.put("canvasName", c.getC_canvas_name());
            item.put("canvasType", c.getC_canvas_type());
            item.put("canvasJson", c.getC_canvas_json());
            previewList.add(item);
        }
        output.setPreviewJson(JSON.toJSONString(previewList));
    }

    @Override
    public void publishCanvas(publishCanvas.Input input, publishCanvas.Output output) {
        String canvasCode = input.getCanvasCode();
        if (canvasCode == null || canvasCode.isEmpty()) {
            throw CanvasErrors.canvasNotFound("null");
        }

        Canvas canvas = CanvasDao.selectByCanvasCode(canvasCode, true);
        String canvasJson = canvas.getC_canvas_json();

        // Build publish JSON from the stored canvas data
        Map<String, Object> publishData = buildPublishJson(canvas, canvasJson);
        output.setPublishJson(JSON.toJSONString(publishData));
    }

    // ---- Private helpers ----

    private void saveCanvasElements(CanvasComponent comp, String canvasCode, String systemCode, String pageCode, String templateCode) {
        // Delete existing elements
        CanvasElementDao.deleteByCanvasCode(canvasCode);

        // Save form elements
        for (Object obj : comp.getCompElements()) {
            if (!(obj instanceof CanvasElemVO)) continue;
            CanvasElemVO vo = (CanvasElemVO) obj;
            // Skip buttons (they are saved separately or as special control types)
            if ("button".equals(vo.getC_control_type()) || "picture".equals(vo.getC_control_type())
                    || "moreinfos".equals(vo.getC_control_type())) {
                continue;
            }
            CanvasElement elem = voToElement(vo, canvasCode, systemCode, templateCode);
            elem.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            List<CanvasElement> batchList = new ArrayList<>();
            batchList.add(elem);
            CanvasElementDao.batchInsert(batchList);
        }

        // Save table elements
        for (CanvasElemVO vo : comp.getTables()) {
            CanvasElement elem = voToElement(vo, canvasCode, systemCode, templateCode);
            elem.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            List<CanvasElement> batchList = new ArrayList<>();
            batchList.add(elem);
            CanvasElementDao.batchInsert(batchList);
        }

        // Save buttons as elements
        for (CanvasElemVO btn : comp.getButtons()) {
            CanvasElement elem = voToElement(btn, canvasCode, systemCode, templateCode);
            elem.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
            elem.setC_control_type("button");
            List<CanvasElement> batchList = new ArrayList<>();
            batchList.add(elem);
            CanvasElementDao.batchInsert(batchList);
        }
    }

    private CanvasElement voToElement(CanvasElemVO vo, String canvasCode, String systemCode, String templateCode) {
        CanvasElement elem = new CanvasElement();
        elem.setC_canvas_code(canvasCode);
        elem.setC_elem_code(vo.getC_elem_code());
        elem.setC_elem_name(vo.getC_elem_name());
        elem.setC_control_type(vo.getC_control_type());
        elem.setC_check_type(vo.getC_check_type());
        elem.setC_required_flag(vo.getC_required_flag());
        elem.setC_readonly_flag(vo.getC_readonly_flag());
        elem.setC_visible_flag(vo.getC_visible_flag());
        elem.setC_default_value(vo.getC_default_value());
        elem.setC_min_value(vo.getC_min_value() != null ? Integer.valueOf(vo.getC_min_value()) : null);
        elem.setC_max_value(vo.getC_max_value() != null ? Integer.valueOf(vo.getC_max_value()) : null);
        elem.setC_precision(vo.getC_precision() != null ? Integer.valueOf(vo.getC_precision()) : null);
        elem.setC_code_list_name(vo.getC_code_list_name());
        elem.setN_string_length(vo.getN_string_length() != null ? Integer.valueOf(vo.getN_string_length()) : null);
        elem.setC_click_event_func(vo.getC_click_event_func());
        elem.setC_comp_code(vo.getC_comp_code());
        elem.setC_rel_field_name(vo.getC_rel_field_name());
        elem.setC_rel_table_name(vo.getC_rel_table_name());
        elem.setC_control_attr(vo.getC_control_attr());
        elem.setC_date_format(vo.getC_date_format());
        elem.setC_frontend_event(vo.getC_frontend_event());
        elem.setC_readonly_var(vo.getC_readonly_var());
        elem.setC_valid_control_attr(vo.getC_valid_control_attr());
        elem.setC_group_flag(vo.getC_group_flag());
        elem.setC_group_first_item(vo.getC_group_first_item());
        elem.setC_client_group(vo.getC_client_group());
        elem.setC_auto_select_first(vo.getC_auto_select_first());
        elem.setC_tooltip_title(vo.getC_tooltip_title());
        elem.setC_search_url(vo.getC_search_url());
        elem.setC_search_param_key(vo.getC_search_param_key());
        elem.setC_search_result_key(vo.getC_search_result_key());
        elem.setC_search_select_event(vo.getC_search_select_event());
        elem.setC_system_code(systemCode);
        elem.setC_template_code(templateCode);
        return elem;
    }

    private void saveCanvasConfig(CanvasComponent comp, String canvasCode, String systemCode, String templateCode) {
        // Delete existing
        CanvasConfigDao.deleteByCanvasCode(canvasCode);

        CanvasConfig config = new CanvasConfig();
        config.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
        config.setC_canvas_code(canvasCode);
        config.setC_canvas_name(comp.getC_canvas_name());
        config.setC_canvas_ename(comp.getC_canvas_ename());
        config.setC_canvas_type(comp.getCanvasType());
        config.setN_columns(comp.getColumns());
        config.setC_buttons_layout(comp.getButtonsLayout());
        config.setC_modify_func(comp.getC_modify_func());
        config.setC_calc_envelop_func(comp.getC_calc_envelop_func());
        config.setC_save_envelop_func(comp.getC_save_envelop_func());
        config.setC_query_envelop_func(comp.getC_query_envelop_func());
        config.setC_add_event_func(comp.getC_add_event_func());
        config.setC_delete_event_func(comp.getC_delete_event_func());
        config.setC_create_event_func(comp.getC_create_event_func());
        config.setC_verify_valid_func(comp.getC_verify_valid_func());
        config.setC_add_control_attr(comp.getC_add_control_attr());
        config.setC_delete_control_attr(comp.getC_delete_control_attr());
        config.setC_comp_flag(comp.getCompFlag());
        config.setC_sql_searchsql(comp.getSearchSql());
        config.setC_sql_insertsql(comp.getInsertSql());
        config.setC_system_code(systemCode);
        config.setC_template_code(templateCode);
        if (comp.getC_oprt_type() != null) {
            config.setC_oprt_type(JSON.toJSONString(comp.getC_oprt_type()));
        }
        config.setC_oprt_button(comp.getC_oprt_button());
        CanvasConfigDao.insert(config);
    }

    private Map<String, Object> assembleEditableJson(Canvas canvas, CanvasConfig config, List<CanvasElement> elements) {
        Map<String, Object> result = new HashMap<>();

        // Canvas info
        result.put("c_canvas_code", canvas.getC_canvas_code());
        result.put("c_canvas_name", canvas.getC_canvas_name());
        result.put("c_canvas_ename", canvas.getC_canvas_ename());
        result.put("canvasType", canvas.getC_canvas_type());
        result.put("canvasJson", canvas.getC_canvas_json());
        result.put("systemCode", canvas.getC_system_code());
        result.put("pageCode", canvas.getC_page_code());

        // Config
        if (config != null) {
            Map<String, Object> cfg = BeanUtil.bean2Map(config);
            result.put("config", cfg);
        }

        // Elements
        List<Map<String, Object>> elemList = new ArrayList<>();
        for (CanvasElement e : elements) {
            elemList.add(BeanUtil.bean2Map(e));
        }
        result.put("elements", elemList);

        return result;
    }

    /**
     * Build a clean, portable publish JSON format for cross-system consumption.
     */
    private Map<String, Object> buildPublishJson(Canvas canvas, String canvasJson) {
        Map<String, Object> publish = new LinkedHashMap<>();
        publish.put("version", "1.0");
        publish.put("publishedAt", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").format(new Date()));

        Map<String, Object> page = new LinkedHashMap<>();
        page.put("code", canvas.getC_page_code() != null ? canvas.getC_page_code() : "");
        page.put("name", canvas.getC_canvas_name() != null ? canvas.getC_canvas_name() : "");
        page.put("englishName", canvas.getC_canvas_ename() != null ? canvas.getC_canvas_ename() : "");
        page.put("canvasCode", canvas.getC_canvas_code() != null ? canvas.getC_canvas_code() : "");
        page.put("type", canvas.getC_canvas_type() != null ? canvas.getC_canvas_type() : "form");
        page.put("systemCode", canvas.getC_system_code() != null ? canvas.getC_system_code() : "");

        // Parse JSON to extract layout and elements
        Map<String, Object> rootObj = null;
        try {
            rootObj = JSON.parseObject(canvasJson, Map.class);
        } catch (Exception e) {
            rootObj = new HashMap<>();
        }

        Map<String, Object> layout = new LinkedHashMap<>();
        layout.put("columns", getInt(rootObj, "columns", 2));
        layout.put("buttonPosition", getStr(rootObj, "buttonsLayout", "bottom"));
        page.put("layout", layout);

        // Parse elements from items[] (new format) or elements[] (legacy)
        List<Map<String, Object>> rawItems = new ArrayList<>();

        // Try new items[] format first
        List<Map<String, Object>> items = getList(rootObj, "items");
        if (items != null && !items.isEmpty()) {
            rawItems = items;
        } else {
            // Fallback to legacy elements[]
            List<Map<String, Object>> legacyElements = getList(rootObj, "elements");
            if (legacyElements != null) {
                for (Map<String, Object> e : legacyElements) {
                    e.put("itemType", "element");
                    rawItems.add(e);
                }
            }
        }

        // Group by itemType
        List<Map<String, Object>> sections = new ArrayList<>();
        List<Map<String, Object>> components = new ArrayList<>();
        List<Map<String, Object>> tables = new ArrayList<>();
        List<Map<String, Object>> elements = new ArrayList<>();

        for (Map<String, Object> item : rawItems) {
            String itemType = (String) item.get("itemType");
            if ("section".equals(itemType)) {
                sections.add(mapSection(item));
            } else if ("component".equals(itemType)) {
                components.add(mapComponent(item));
            } else if ("table".equals(itemType)) {
                tables.add(mapTable(item));
            } else {
                elements.add(mapElement(item));
            }
        }

        page.put("sections", sections);
        page.put("components", components);
        page.put("tables", tables);
        page.put("elements", elements);

        // Buttons
        List<Map<String, Object>> buttons = new ArrayList<>();
        List<Map<String, Object>> rawButtons = getList(rootObj, "buttons");
        if (rawButtons != null) {
            for (Map<String, Object> b : rawButtons) {
                buttons.add(mapButton(b));
            }
        }
        page.put("buttons", buttons);

        publish.put("page", page);
        return publish;
    }

    private Map<String, Object> mapElement(Map<String, Object> e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", getStr(e, "elem_code", ""));
        m.put("name", getStr(e, "elem_name", ""));
        m.put("englishName", getStr(e, "elem_ename", ""));
        m.put("controlType", getStr(e, "control_type", "text"));
        m.put("fieldName", getStr(e, "rel_field_name", ""));
        m.put("tableName", getStr(e, "rel_table_name", ""));
        m.put("required", "1".equals(getStr(e, "required_flag", "0")));
        m.put("visible", !"0".equals(getStr(e, "visible_flag", "1")));
        m.put("readonly", "1".equals(getStr(e, "readonly_flag", "0")));
        m.put("enabled", !"0".equals(getStr(e, "enabled_flag", "1")));
        m.put("defaultValue", getStr(e, "default_value", ""));
        m.put("placeholder", getStr(e, "placeholder", ""));
        m.put("tooltip", getStr(e, "tooltip_title", ""));
        m.put("checkType", getStr(e, "check_type", "none"));
        m.put("codeListName", getStr(e, "code_list_name", ""));
        m.put("controlAttr", getStr(e, "control_attr", ""));
        m.put("minValue", getStr(e, "min_value", ""));
        m.put("maxValue", getStr(e, "max_value", ""));
        m.put("stringLength", getStr(e, "string_length", ""));
        m.put("columnWidth", getInt(e, "column_width", 0));
        return m;
    }

    private Map<String, Object> mapComponent(Map<String, Object> c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", getStr(c, "refCode", ""));
        m.put("name", getStr(c, "refName", ""));
        m.put("columns", getInt(c, "compColumns", 2));
        List<Map<String, Object>> childElements = new ArrayList<>();
        List<Map<String, Object>> raw = getList(c, "childElements");
        if (raw != null) {
            for (Map<String, Object> e : raw) {
                childElements.add(mapElement(e));
            }
        }
        m.put("elements", childElements);
        return m;
    }

    private Map<String, Object> mapTable(Map<String, Object> t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", getStr(t, "refName", "数据列表"));
        List<Map<String, Object>> columns = new ArrayList<>();
        List<Map<String, Object>> raw = getList(t, "childElements");
        if (raw != null) {
            for (Map<String, Object> e : raw) {
                columns.add(mapElement(e));
            }
        }
        m.put("columns", columns);
        return m;
    }

    private Map<String, Object> mapSection(Map<String, Object> sec) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", getStr(sec, "refName", "区块"));
        List<Map<String, Object>> items = new ArrayList<>();
        List<Map<String, Object>> raw = getList(sec, "childItems");
        if (raw != null) {
            for (Map<String, Object> it : raw) {
                items.add(mapChildItem(it));
            }
        }
        m.put("items", items);
        return m;
    }

    private Map<String, Object> mapChildItem(Map<String, Object> item) {
        String itemType = (String) item.get("itemType");
        if ("component".equals(itemType)) {
            Map<String, Object> m = mapComponent(item);
            m.put("type", "component");
            return m;
        }
        if ("table".equals(itemType)) {
            Map<String, Object> m = mapTable(item);
            m.put("type", "table");
            return m;
        }
        Map<String, Object> m = mapElement(item);
        m.put("type", "element");
        return m;
    }

    private Map<String, Object> mapButton(Map<String, Object> b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", getStr(b, "btn_code", getStr(b, "code", "")));
        m.put("name", getStr(b, "btn_name", getStr(b, "name", "")));
        m.put("eventType", getStr(b, "btn_event_type", getStr(b, "eventType", "")));
        m.put("displayText", getStr(b, "btn_text", getStr(b, "text", "")));
        m.put("order", b.get("btn_order") != null ? b.get("btn_order") : (b.get("order") != null ? b.get("order") : 0));
        return m;
    }

    // --- Safe accessor helpers ---
    private static String getStr(Map<String, Object> map, String key, String defaultVal) {
        Object val = map != null ? map.get(key) : null;
        return val != null ? String.valueOf(val) : defaultVal;
    }

    private static int getInt(Map<String, Object> map, String key, int defaultVal) {
        Object val = map != null ? map.get(key) : null;
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (NumberFormatException e) { return defaultVal; }
        }
        return defaultVal;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> getList(Map<String, Object> map, String key) {
        Object val = map != null ? map.get(key) : null;
        if (val instanceof List) {
            List<?> list = (List<?>) val;
            if (list.isEmpty()) return new ArrayList<>();
            if (list.get(0) instanceof Map) return (List<Map<String, Object>>) list;
        }
        return null;
    }
}
