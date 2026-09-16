package com.hundsun.bontal.canvas.engine;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 数据对象工具类 (from prod-service DataObjectUtils)
 */
public class DataObjectUtils {

    public static String getStringByKey(Object obj, String key) {
        String valueStr = "";
        if (obj != null) {
            Map<String, Object> dataMap = (Map<String, Object>) obj;
            Object valObj = dataMap.get(key);
            if (valObj != null) {
                valueStr = String.valueOf(valObj);
            }
        }
        return valueStr;
    }

    public static List<Object> getListByKey(Object obj, String key) {
        List<Object> list = new ArrayList<Object>();
        if (obj != null) {
            Map<String, Object> dataMap = (Map<String, Object>) obj;
            Object valObj = dataMap.get(key);
            if (valObj != null) {
                list = (List<Object>) valObj;
            }
        }
        return list;
    }

    public static int getIntByKey(Object obj, String key) {
        int valInt = 0;
        if (obj != null) {
            Map<String, Object> dataMap = (Map<String, Object>) obj;
            Object valObj = dataMap.get(key);
            if (valObj != null) {
                valInt = (Integer) valObj;
            }
        }
        return valInt;
    }

    public static double getDoubleByKey(Object obj, String key) {
        double valDou = 0;
        if (obj != null) {
            Map<String, Object> dataMap = (Map<String, Object>) obj;
            Object valObj = dataMap.get(key);
            if (valObj != null) {
                valDou = Double.valueOf(valObj.toString());
            }
        }
        return valDou;
    }

    public static List<Map<String, Object>> getMapListByKey(Object obj, String key) {
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        if (obj != null) {
            Map<String, Object> dataMap = (Map<String, Object>) obj;
            try {
                List<Map<String, Object>> valObjList = (List<Map<String, Object>>) dataMap.get(key);
                if (valObjList != null) {
                    list = valObjList;
                }
            } catch (Exception e) {
                Map<String, Object> valObj = (Map<String, Object>) dataMap.get(key);
                if (valObj != null) {
                    list.add(valObj);
                }
            }
        }
        return list;
    }

    public static Map<String, Object> getMapByKey(Map<String, Object> rootMap, String key) {
        Map<String, Object> resultMap = null;
        if (rootMap != null) {
            Object resultObj = rootMap.get(key);
            if (resultObj != null) {
                if (resultObj instanceof Map)
                    resultMap = (Map<String, Object>) resultObj;
                else if (resultObj instanceof List) {
                    List list = (List) resultObj;
                    if (list != null && !list.isEmpty() && list.size() > 0) {
                        resultMap = (Map<String, Object>) ((List) resultObj).get(0);
                    }
                }
            }
        }
        return resultMap;
    }
}
