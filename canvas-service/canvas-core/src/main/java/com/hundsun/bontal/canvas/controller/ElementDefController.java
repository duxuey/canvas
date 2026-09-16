package com.hundsun.bontal.canvas.controller;

import com.hundsun.bontal.canvas.dao.CanvasElementDao;
import com.hundsun.bontal.canvas.errors.ApiErrors;
import com.hundsun.bontal.canvas.errors.ApiResponse;
import com.hundsun.bontal.canvas.model.CanvasElement;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Element definition management controller.
 * Manages element defs (tb_canvas_element with c_canvas_code=NULL).
 *
 * 错误码: BONTAL_ELEMDEF_*
 */
@RestController
@RequestMapping("/element_def")
public class ElementDefController {

    // ──── 校验 ────
    private List<Map<String, Object>> validateSaveInput(Map<String, Object> input) {
        List<Map<String, Object>> issues = new ArrayList<>();
        String name = (String) input.getOrDefault("elemName", "");
        if (name.trim().isEmpty()) {
            issues.add(ApiResponse.issue("elemName", "元件名称不能为空"));
        }
        String code = (String) input.getOrDefault("elemCode", "");
        if (!code.isEmpty() && !code.matches("^[a-z][a-z0-9_]*$")) {
            issues.add(ApiResponse.issue("elemCode", "元件代码须小写字母开头，只含 a-z/0-9/_"));
        }
        return issues;
    }

    // ──── CRUD ────

    @PostMapping("/save")
    public Map<String, Object> save(@RequestBody Map<String, Object> input) {
        List<Map<String, Object>> issues = validateSaveInput(input);
        if (!issues.isEmpty()) {
            return ApiResponse.fail(ApiErrors.ELEMDEF_INVALID, "输入校验未通过", false, issues);
        }

        String elemCode = (String) input.getOrDefault("elemCode", "");
        String elemName = (String) input.getOrDefault("elemName", "");
        String systemCode = (String) input.getOrDefault("systemCode", "SYS01");

        if (elemCode == null || elemCode.isEmpty()) {
            elemCode = "elem_" + System.currentTimeMillis();
        }

        Map<String, Object> existingDef = CanvasElementDao.selectDefByCode(elemCode, systemCode);

        CanvasElement entity = new CanvasElement();
        entity.setC_elem_code(elemCode);
        if (existingDef == null) {
            entity.setC_pk_id(String.valueOf(System.currentTimeMillis()));
            entity.setC_canvas_code("");
            entity.setC_system_code(systemCode);
            entity.setC_enabled_flag("1");
            entity.setC_visible_flag("1");
        }

        entity.setC_control_type((String) input.getOrDefault("controlType", "text"));
        entity.setC_elem_name(elemName);
        entity.setC_elem_ename((String) input.getOrDefault("elemEname", ""));
        entity.setC_rel_table_name((String) input.getOrDefault("relTableName", ""));
        entity.setC_rel_field_name((String) input.getOrDefault("relFieldName", ""));
        entity.setC_default_value((String) input.getOrDefault("defaultValue", ""));
        entity.setC_tooltip_title((String) input.getOrDefault("tooltipTitle", ""));
        entity.setC_required_flag(asStr(input.get("requiredFlag"), "0"));
        entity.setC_check_type((String) input.getOrDefault("checkType", ""));
        entity.setC_code_list_name((String) input.getOrDefault("codeListName", ""));

        String dataType = (String) input.getOrDefault("dataType", "varchar");
        String placeholder = (String) input.getOrDefault("placeholder", "");
        String controlAttr = buildControlAttr(
            (String) input.getOrDefault("controlAttr", ""),
            dataType, placeholder);
        entity.setC_control_attr(controlAttr);

        String minVal = (String) input.get("minValue");
        if (minVal != null && !minVal.isEmpty()) entity.setC_min_value(Integer.valueOf(minVal));
        String maxVal = (String) input.get("maxValue");
        if (maxVal != null && !maxVal.isEmpty()) entity.setC_max_value(Integer.valueOf(maxVal));
        String strLen = (String) input.get("stringLength");
        if (strLen != null && !strLen.isEmpty()) entity.setN_string_length(Integer.valueOf(strLen));

        if (existingDef != null) {
            CanvasElementDao.updateDefByCode(entity);
        } else {
            CanvasElementDao.insert(entity);
        }

        return ApiResponse.ok(MapBuilder.of("elemCode", elemCode));
    }

    @PostMapping("/delete")
    public Map<String, Object> delete(@RequestBody Map<String, Object> input) {
        String code = (String) input.get("code");
        String systemCode = (String) input.getOrDefault("systemCode", "SYS01");
        if (code == null || code.isEmpty()) {
            return ApiResponse.fail(ApiErrors.ELEMDEF_INVALID, "缺少元件代码", false);
        }
        Map<String, Object> existing = CanvasElementDao.selectDefByCode(code, systemCode);
        if (existing == null) {
            return ApiResponse.fail(ApiErrors.ELEMDEF_NOT_FOUND,
                "元件定义不存在: " + code, false);
        }
        CanvasElementDao.deleteDefByCode(code, systemCode);
        return ApiResponse.ok(MapBuilder.of("deletedCode", code));
    }

    @PostMapping("/query_by_code")
    public Map<String, Object> queryByCode(@RequestBody Map<String, Object> input) {
        String code = (String) input.get("code");
        String systemCode = (String) input.getOrDefault("systemCode", "SYS01");
        if (code == null || code.isEmpty()) {
            return ApiResponse.fail(ApiErrors.ELEMDEF_INVALID, "缺少元件代码", false);
        }
        Map<String, Object> def = CanvasElementDao.selectDefByCode(code, systemCode);
        if (def == null) {
            return ApiResponse.fail(ApiErrors.ELEMDEF_NOT_FOUND,
                "元件定义不存在: " + code, false);
        }
        enrichDefWithControlAttr(def);
        return ApiResponse.ok(MapBuilder.of("def", def));
    }

    @PostMapping("/query_by_system")
    public Map<String, Object> queryBySystem(@RequestBody Map<String, Object> input) {
        String systemCode = (String) input.getOrDefault("systemCode", "SYS01");
        List<Map<String, Object>> list = CanvasElementDao.selectDefsBySystem(systemCode);
        if (list != null) {
            for (Map<String, Object> def : list) {
                enrichDefWithControlAttr(def);
            }
        }
        return ApiResponse.ok(MapBuilder.of("defs", list != null ? list : new ArrayList<>()));
    }

    @PostMapping("/query_by_type")
    public Map<String, Object> queryByType(@RequestBody Map<String, Object> input) {
        String systemCode = (String) input.getOrDefault("systemCode", "SYS01");
        String controlType = (String) input.get("controlType");
        List<Map<String, Object>> all = CanvasElementDao.selectDefsBySystem(systemCode);
        List<Map<String, Object>> defs = new ArrayList<>();
        if (all != null) {
            for (Map<String, Object> e : all) {
                if (controlType == null || controlType.equals(e.get("control_type"))) {
                    enrichDefWithControlAttr(e);
                    defs.add(e);
                }
            }
        }
        return ApiResponse.ok(MapBuilder.of("defs", defs));
    }

    // ──── helpers ────

    private String asStr(Object val, String def) {
        return val != null ? String.valueOf(val) : def;
    }

    @SuppressWarnings("unchecked")
    private String buildControlAttr(String existingControlAttr, String dataType, String placeholder) {
        Map<String, Object> merged = new LinkedHashMap<>();
        if (existingControlAttr != null && !existingControlAttr.trim().isEmpty()) {
            try {
                Object parsed = com.alibaba.fastjson.JSON.parse(existingControlAttr);
                if (parsed instanceof Map) {
                    merged.putAll((Map<String, Object>) parsed);
                } else if (parsed instanceof List) {
                    merged.put("options", parsed);
                }
            } catch (Exception ignored) {
                merged.put("raw", existingControlAttr);
            }
        }
        merged.put("dataType", dataType != null ? dataType : "varchar");
        merged.put("placeholder", placeholder != null ? placeholder : "");
        return com.alibaba.fastjson.JSON.toJSONString(merged);
    }

    @SuppressWarnings("unchecked")
    private void enrichDefWithControlAttr(Map<String, Object> def) {
        Object controlAttr = def.get("control_attr");
        if (controlAttr == null) return;
        try {
            Object parsed = com.alibaba.fastjson.JSON.parse(String.valueOf(controlAttr));
            if (parsed instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) parsed;
                if (!def.containsKey("data_type")) {
                    def.put("data_type", map.getOrDefault("dataType", "varchar"));
                }
                if (!def.containsKey("placeholder")) {
                    def.put("placeholder", map.getOrDefault("placeholder", ""));
                }
                if (map.containsKey("options")) {
                    def.put("control_attr", com.alibaba.fastjson.JSON.toJSONString(map.get("options")));
                }
            }
        } catch (Exception ignored) {
            // not valid JSON, leave as-is
        }
    }

    private static class MapBuilder {
        static Map<String, Object> of(String k, Object v) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put(k, v);
            return m;
        }
    }
}
