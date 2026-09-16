package com.hundsun.bontal.canvas.serviceimpl;

import com.alibaba.fastjson.JSON;
import com.hundsun.bontal.canvas.dao.CanvasDao;
import com.hundsun.bontal.canvas.dao.CanvasPublishDao;
import com.hundsun.bontal.canvas.errors.CanvasErrors;
import com.hundsun.bontal.canvas.model.Canvas;
import com.hundsun.bontal.canvas.model.CanvasPublish;
import com.hundsun.bontal.canvas.service.CanvasPublishService;
import com.hundsun.bontal.common.util.BeanUtil;
import com.hundsun.ta.base.BusinessMinService;
import com.hundsun.ta.utils.SnowflakeIdWorker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 画布发布记录服务实现
 */
@Service
@Slf4j
public class CanvasPublishServiceImpl extends BusinessMinService implements CanvasPublishService {

    @Override
    @Transactional
    public void publish(publish.Input input, publish.Output output) {
        String canvasCode = input.getCanvasCode();
        if (canvasCode == null || canvasCode.isEmpty()) {
            throw CanvasErrors.canvasNotFound("null");
        }

        Canvas canvas = CanvasDao.selectByCanvasCode(canvasCode, true);
        String canvasJson = canvas.getC_canvas_json();

        // Build publish JSON
        Map<String, Object> publishPage = buildPublishPage(canvas, canvasJson);
        String publishJson = JSON.toJSONString(publishPage);

        // Auto-increment version number
        int maxVersion = CanvasPublishDao.selectMaxVersion(canvasCode);
        int newVersion = maxVersion + 1;

        // Insert publish record
        CanvasPublish record = new CanvasPublish();
        record.setC_pk_id(String.valueOf(SnowflakeIdWorker.getId()));
        record.setC_canvas_code(canvasCode);
        record.setN_version(newVersion);
        record.setC_version_name(input.getVersionName() != null ? input.getVersionName() : ("v" + newVersion));
        record.setC_publish_json(publishJson);
        record.setC_publish_note(input.getPublishNote() != null ? input.getPublishNote() : "");
        record.setC_status("published");
        record.setC_system_code(input.getSystemCode() != null ? input.getSystemCode() : canvas.getC_system_code());
        CanvasPublishDao.insert(record);

        output.setPkId(record.getC_pk_id());
        output.setVersion(newVersion);
        output.setPublishJson(publishJson);
    }

    @Override
    public void queryVersions(queryVersions.Input input, queryVersions.Output output) {
        String canvasCode = input.getCanvasCode();
        if (canvasCode == null || canvasCode.isEmpty()) {
            output.setVersions(Collections.emptyList());
            return;
        }

        List<CanvasPublish> list = CanvasPublishDao.selectByCanvasCode(canvasCode);
        List<Map<String, Object>> versions = new ArrayList<>();
        for (CanvasPublish p : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pkId", p.getC_pk_id());
            m.put("canvasCode", p.getC_canvas_code());
            m.put("version", p.getN_version());
            m.put("versionName", p.getC_version_name());
            m.put("publishNote", p.getC_publish_note());
            m.put("status", p.getC_status());
            m.put("systemCode", p.getC_system_code());
            m.put("createdAt", p.getD_crtr_time());
            m.put("updatedAt", p.getD_uptr_time());
            // Don't include full JSON in list — too heavy
            versions.add(m);
        }
        output.setVersions(versions);
    }

    @Override
    public void queryDetail(queryDetail.Input input, queryDetail.Output output) {
        CanvasPublish p = CanvasPublishDao.selectByPkId(input.getPkId(), true);
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("pkId", p.getC_pk_id());
        detail.put("canvasCode", p.getC_canvas_code());
        detail.put("version", p.getN_version());
        detail.put("versionName", p.getC_version_name());
        detail.put("publishNote", p.getC_publish_note());
        detail.put("publishJson", p.getC_publish_json());
        detail.put("status", p.getC_status());
        detail.put("systemCode", p.getC_system_code());
        detail.put("createdAt", p.getD_crtr_time());
        detail.put("updatedAt", p.getD_uptr_time());
        output.setDetail(detail);
    }

    @Override
    @Transactional
    public void updateMeta(updateMeta.Input input, updateMeta.Output output) {
        CanvasPublish record = CanvasPublishDao.selectByPkId(input.getPkId(), true);
        if (input.getVersionName() != null) {
            record.setC_version_name(input.getVersionName());
        }
        if (input.getPublishNote() != null) {
            record.setC_publish_note(input.getPublishNote());
        }
        if (input.getStatus() != null) {
            record.setC_status(input.getStatus());
        }
        CanvasPublishDao.updateMeta(record);
    }

    @Override
    @Transactional
    public void deprecate(deprecate.Input input, deprecate.Output output) {
        CanvasPublishDao.deprecate(input.getPkId());
    }

    // ==================== Publish JSON builder ====================

    private Map<String, Object> buildPublishPage(Canvas canvas, String canvasJson) {
        Map<String, Object> publish = new LinkedHashMap<>();
        publish.put("version", "1.0");
        publish.put("publishedAt", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").format(new Date()));

        Map<String, Object> page = new LinkedHashMap<>();
        page.put("code", nvl(canvas.getC_page_code(), ""));
        page.put("name", nvl(canvas.getC_canvas_name(), ""));
        page.put("englishName", nvl(canvas.getC_canvas_ename(), ""));
        page.put("canvasCode", nvl(canvas.getC_canvas_code(), ""));
        page.put("type", nvl(canvas.getC_canvas_type(), "form"));
        page.put("systemCode", nvl(canvas.getC_system_code(), ""));

        Map<String, Object> rootObj = parseJson(canvasJson);

        Map<String, Object> layout = new LinkedHashMap<>();
        layout.put("columns", getInt(rootObj, "columns", 2));
        layout.put("buttonPosition", getStr(rootObj, "buttonsLayout", "bottom"));
        page.put("layout", layout);

        // Parse items
        List<Map<String, Object>> rawItems = getList(rootObj, "items");
        if (rawItems == null) {
            List<Map<String, Object>> legacyElements = getList(rootObj, "elements");
            rawItems = new ArrayList<>();
            if (legacyElements != null) {
                for (Map<String, Object> e : legacyElements) {
                    e.put("itemType", "element");
                    rawItems.add(e);
                }
            }
        }

        List<Map<String, Object>> sections = new ArrayList<>();
        List<Map<String, Object>> components = new ArrayList<>();
        List<Map<String, Object>> tables = new ArrayList<>();
        List<Map<String, Object>> elements = new ArrayList<>();

        if (rawItems != null) {
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
        }

        page.put("sections", sections);
        page.put("components", components);
        page.put("tables", tables);
        page.put("elements", elements);

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

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String jsonStr) {
        try {
            return JSON.parseObject(jsonStr, Map.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private static String nvl(String val, String defaultVal) {
        return val != null ? val : defaultVal;
    }

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
