package com.hundsun.bontal.canvas.engine;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.List;
import java.util.Map;

import com.alibaba.fastjson.JSON;

/**
 * 画布JSON解析器 (from JsonParse)
 * 关键简化: formDataAssembly/tableDataAssembly 从4组row变为1组row
 * 删除 cvrgPersonalList/endr&#42;/visit&#42; 逻辑
 */
public class CanvasJsonParser {

    /**
     * 解析JSON到画布组件对象
     */
    public static CanvasComponent parseCanvasJson(String jsonStr) {
        Object rootObj = JSON.parse(jsonStr);
        CanvasComponent comp = new CanvasComponent();

        // 画布基本信息
        String c_canvas_name = DataObjectUtils.getStringByKey(rootObj, "c_canvas_name");
        comp.setC_canvas_name(c_canvas_name);
        String c_canvas_ename = DataObjectUtils.getStringByKey(rootObj, "c_canvas_ename");
        comp.setC_canvas_ename(c_canvas_ename);
        String c_canvas_code = DataObjectUtils.getStringByKey(rootObj, "c_canvas_code");
        comp.setC_canvas_code(c_canvas_code);
        int columns = DataObjectUtils.getIntByKey(rootObj, "columns");
        comp.setColumns(columns);
        String canvasType = DataObjectUtils.getStringByKey(rootObj, "canvasType");
        comp.setCanvasType(canvasType);

        // 事件方法名
        comp.setC_modify_func(DataObjectUtils.getStringByKey(rootObj, "c_modify_func"));
        comp.setC_calc_envelop_func(DataObjectUtils.getStringByKey(rootObj, "c_calc_envelop_func"));
        comp.setC_save_envelop_func(DataObjectUtils.getStringByKey(rootObj, "c_save_envelop_func"));
        comp.setC_query_envelop_func(DataObjectUtils.getStringByKey(rootObj, "c_query_envelop_func"));
        comp.setC_add_event_func(DataObjectUtils.getStringByKey(rootObj, "c_add_event_func"));
        comp.setC_delete_event_func(DataObjectUtils.getStringByKey(rootObj, "c_delete_event_func"));
        comp.setC_create_event_func(DataObjectUtils.getStringByKey(rootObj, "c_create_event_func"));
        comp.setC_verify_valid_func(DataObjectUtils.getStringByKey(rootObj, "c_verify_valid_func"));

        // 按钮属性
        comp.setC_add_control_attr(DataObjectUtils.getStringByKey(rootObj, "c_add_control_attr"));
        comp.setC_delete_control_attr(DataObjectUtils.getStringByKey(rootObj, "c_delete_control_attr"));
        comp.setC_oprt_button(DataObjectUtils.getStringByKey(rootObj, "c_oprt_button"));

        // SQL
        comp.setSearchSql(DataObjectUtils.getStringByKey(rootObj, "searchSql"));
        comp.setInsertSql(DataObjectUtils.getStringByKey(rootObj, "insertSql"));

        // 操作类型
        List<Object> c_oprt_type = DataObjectUtils.getListByKey(rootObj, "c_oprt_type");
        comp.setC_oprt_type(c_oprt_type);

        // 组件标志
        String compFlag = DataObjectUtils.getStringByKey(rootObj, "compFlag");
        comp.setCompFlag(compFlag);

        // 表格默认数据
        List<Object> c_table_default_info = DataObjectUtils.getListByKey(rootObj, "c_table_default_info");
        comp.setC_table_default_info(c_table_default_info);

        // 根据画布类型组装数据
        if ("form".equals(canvasType)) {
            formDataAssembly(rootObj, comp);
        } else if ("table".equals(canvasType)) {
            tableDataAssembly(rootObj, comp);
        }

        // 按钮组处理
        String buttonsLayout = DataObjectUtils.getStringByKey(rootObj, "buttonsLayout");
        comp.setButtonsLayout(buttonsLayout);
        buttonDataAssembly(rootObj, comp);

        return comp;
    }

    /**
     * 组装按钮组数据
     */
    private static void buttonDataAssembly(Object rootObj, CanvasComponent comp) {
        List<Object> buttonList = DataObjectUtils.getListByKey(rootObj, "buttons");
        for (int i = 0, length = buttonList.size(); i < length; i++) {
            Object fieldObj = buttonList.get(i);
            CanvasElemVO elem = new CanvasElemVO();
            Map<String, Object> fieldMap = (Map<String, Object>) fieldObj;
            mapToObject(fieldMap, elem);
            comp.addButton(elem);
        }
    }

    /**
     * 组装表格数据 (简化: 单一 row 替代原4组row)
     */
    private static void tableDataAssembly(Object rootObj, CanvasComponent comp) {
        List<Object> elemArray = DataObjectUtils.getListByKey(rootObj, "elements");
        boolean runedFlag = false;
        CanvasRow row = null;
        int rowCount = 0;

        for (int i = 0, length = elemArray.size(); i < length; i++) {
            if ((rowCount % 3) == 0) {
                row = new CanvasRow("0");
                comp.addRow(row);
            }
            Object fieldObj = elemArray.get(i);
            CanvasElemVO elem = new CanvasElemVO();
            Map<String, Object> fieldMap = (Map<String, Object>) fieldObj;
            mapToObject(fieldMap, elem);
            if (!runedFlag) {
                runedFlag = true;
                comp.setC_rel_table_name(elem.getC_rel_table_name());
            }
            comp.addTableColumn(elem);
            comp.addCompElements(elem);
            if ("1".equals(elem.getC_visible_flag())) {
                rowCount++;
                row.setC_is_show("1");
            }
            row.addElement(elem);
        }
    }

    /**
     * 组装表单数据 (简化: 单一 row 替代原4组row)
     */
    private static void formDataAssembly(Object rootObj, CanvasComponent comp) {
        List<Object> elemArray = DataObjectUtils.getListByKey(rootObj, "elements");
        int colNum = comp.getColumns();
        int colWidth = 12 / colNum;
        CanvasRow row = null;
        int rowCount = 0;
        boolean runedFlag = false;

        for (int i = 0, length = elemArray.size(); i < length; i++) {
            if ((rowCount % colNum) == 0) {
                row = new CanvasRow("0");
                comp.addRow(row);
            }
            Object fieldObj = elemArray.get(i);
            Map<String, Object> fieldMap = (Map<String, Object>) fieldObj;
            String c_control_type = (String) fieldMap.get("c_control_type");
            if (!runedFlag) {
                runedFlag = true;
                comp.setC_rel_table_name((String) fieldMap.get("c_rel_table_name"));
            }

            if ("groupFields".equals(c_control_type)) {
                // 合并字段组
                int column_width = (Integer) fieldMap.get("column_width");
                Object fieldsObj = fieldMap.get("fields");
                List<Object> memberArray = (List<Object>) fieldsObj;
                column_width = column_width / memberArray.size();
                boolean visibleFlag = false;
                for (Object memberObj : memberArray) {
                    Map<String, Object> memberMap = (Map<String, Object>) memberObj;
                    CanvasElemVO elem = new CanvasElemVO();
                    mapToObject(memberMap, elem);
                    elem.setColumn_width(column_width);
                    comp.addCompElements(elem);
                    if ("1".equals(elem.getC_visible_flag())) {
                        visibleFlag = true;
                    }
                    row.addElement(elem);
                }
                if (visibleFlag) {
                    rowCount++;
                    row.setC_is_show("1");
                }
            } else {
                CanvasElemVO elem = new CanvasElemVO();
                mapToObject(fieldMap, elem);
                comp.addCompElements(elem);
                if ("1".equals(elem.getC_visible_flag())) {
                    rowCount++;
                    row.setC_is_show("1");
                }
                row.addElement(elem);
            }
        }
    }

    /**
     * Map到对象的数据结构转换
     */
    public static Object mapToObject(Map<String, Object> map, Object obj) {
        if (map == null) return null;

        Field[] fields = obj.getClass().getDeclaredFields();
        Object valueObj = null;
        for (Field field : fields) {
            valueObj = map.get(field.getName());
            if (valueObj != null) {
                int mod = field.getModifiers();
                if (Modifier.isStatic(mod) || Modifier.isFinal(mod)) {
                    continue;
                }
                field.setAccessible(true);
                try {
                    if ("c_rel_field_name".equals(field.getName())
                            || "c_rel_table_name".equals(field.getName())) {
                        String valueStr = String.valueOf(valueObj);
                        valueObj = valueStr.toLowerCase();
                    }
                    if ("c_min_value".equals(field.getName()) || "c_max_value".equals(field.getName())
                            || "c_precision".equals(field.getName()) || "n_string_length".equals(field.getName())) {
                        String valueStr = String.valueOf(valueObj);
                        field.set(obj, valueStr);
                    } else {
                        field.set(obj, valueObj);
                    }
                } catch (IllegalArgumentException e) {
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                }
            }
        }
        return obj;
    }
}
