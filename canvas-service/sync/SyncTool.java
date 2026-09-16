import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 产品工厂 -> 画布系统 三层同步工具（双向同步基础版）
 *
 * 三层模型（忠实镜像产品工厂，保证反向回写可精确映射）：
 *
 *   层1 元件定义（全局模板） tb_canvas_element（c_canvas_code=''）
 *        = 产品工厂 c_elem_no 去重（全局控件模板，1226 个）
 *   层2 组件（产品专属实例） tb_element_group（c_group_code = c_screen_no）
 *        = 产品工厂画面组件 tb_prod_rel_screen（7111 个，产品专属）
 *   层3 画布（产品页面）     tb_canvas（c_canvas_code = prodNo_contentType）
 *        = 产品工厂某产品某页面类型的画面组件集合（约 360 个）
 *
 * 设计约束（保证双向同步）：
 *   - 画布只引用组件，不直接面对元件
 *   - 组件 = 产品专属实例（code 用 c_screen_no，全局唯一且产品专属）
 *   - 元件定义是唯一全局共享层
 *
 * 元件两种来源：
 *   - 非车险（01/02/07/15/23/26/27/32...）：tb_prod_screen_rel_elem 表
 *   - 车险（05）：tb_prod_rel_screen.c_screen_json.formFields[]（JSON 内嵌）
 *
 * 编译运行：
 *   javac -encoding UTF-8 -cp "../canvas-app/target/lib/mysql-connector-java-8.0.20.jar" SyncTool.java
 *   java  -cp ".;../canvas-app/target/lib/mysql-connector-java-8.0.20.jar" SyncTool
 */
public class SyncTool {

    private static final String SRC_URL = "jdbc:mysql://10.1.23.21:33061/fpic_prod_db"
            + "?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai"
            + "&rewriteBatchedStatements=true&connectTimeout=30000&socketTimeout=0&autoReconnect=true";
    private static final String SRC_USER = "fpic_prod";
    private static final String SRC_PWD = "123456";

    private static final String DST_URL = "jdbc:mysql://localhost:3306/core_db"
            + "?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&rewriteBatchedStatements=true";
    private static final String DST_USER = "root";
    private static final String DST_PWD = "123456";

    private static final String SYSTEM_CODE = "SYS01";

    private static final java.util.concurrent.atomic.AtomicLong ID_SEQ =
            new java.util.concurrent.atomic.AtomicLong(1787000000000000000L);

    private static String nextId() {
        return String.valueOf(ID_SEQ.incrementAndGet());
    }

    /** 统一元件模型（车险/非车险归一） */
    static class Elem {
        String elemCode, elemName, elemEname, controlType, checkType;
        String requiredFlag, readonlyFlag, visibleFlag, defaultVal, enabledFlag;
        Integer minValue, maxValue, precision;
        String codeListName, clickEventFunc, compCode;
        Integer stringLength;
        Double showSeq;
        String relFieldName, relTableName, controlAttr, dateFormat, frontendEvent;
        String readonlyVar, validControlAttr, groupFlag, groupFirstItem, clientGroup;
        String autoSelectFirst, tooltipTitle, searchUrl, searchParamKey, searchResultKey, searchSelectEvent;
        String btnLayout; // 按钮位置：head=顶部操作栏 / foot=底部按钮栏 / null=默认底部
    }

    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("未找到 MySQL 驱动: " + e.getMessage());
            System.exit(1);
        }

        try (Connection src = DriverManager.getConnection(SRC_URL, SRC_USER, SRC_PWD);
             Connection dst = DriverManager.getConnection(DST_URL, DST_USER, DST_PWD)) {

            System.out.println("=== 1. 清理画布系统数据 ===");
            cleanTarget(dst);

            System.out.println("\n=== 2. 加载产品与画面清单 ===");
            Map<String, String> prodNameMap = loadProductNames(src);
            List<Map<String, Object>> screens = loadScreens(src);
            System.out.println("  画面组件 " + screens.size() + " 个");

            System.out.println("\n=== 3. 加载元件（非车险 from elem 表，车险 from json.formFields） ===");
            Map<String, List<Elem>> screenElems = loadAllElements(src, screens);
            System.out.println("  含元件画面 " + screenElems.size() + " 个");

            System.out.println("\n=== 3.5 加载画面列数（from screen_prop + 车险 json.rowColumns） ===");
            Map<String, Integer> screenColumns = loadScreenColumns(src, screens);
            System.out.println("  列数映射 " + screenColumns.size() + " 个");

            System.out.println("\n=== 4. 生成元件定义（c_elem_no 去重，全局模板） ===");
            int nDefs = writeElementDefs(dst, screenElems);
            System.out.println("  元件定义 " + nDefs + " 个");

            System.out.println("\n=== 5. 生成组件（产品专属实例，code=c_screen_no） ===");
            int nComp = writeComponents(dst, screens, screenElems, screenColumns);
            System.out.println("  组件 " + nComp + " 个");

            System.out.println("\n=== 6. 生成画布（产品页面，items 引用组件） ===");
            int nCanvas = writeCanvases(dst, screens, screenElems, screenColumns, prodNameMap);
            System.out.println("  画布 " + nCanvas + " 个");

            System.out.println("\n=== 7. 核对 ===");
            verify(dst);

            System.out.println("\n三层同步完成。");
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    // ---------- 清理 ----------

    private static void cleanTarget(Connection dst) throws Exception {
        String[] tables = {
                "tb_canvas_publish", "tb_canvas_element", "tb_canvas_config",
                "tb_canvas_button", "tb_element_group_item", "tb_element_group",
                "tb_page_template", "tb_canvas"
        };
        try (Statement st = dst.createStatement()) {
            for (String t : tables) {
                int n = st.executeUpdate("DELETE FROM " + t);
                System.out.println("  " + t + " 清理 " + n + " 条");
            }
        }
    }

    // ---------- 加载 ----------

    private static Map<String, String> loadProductNames(Connection src) throws Exception {
        Map<String, String> m = new HashMap<>();
        try (Statement st = src.createStatement();
             ResultSet rs = st.executeQuery("SELECT c_prod_no, c_prod_name FROM tb_prod_dfn_product")) {
            while (rs.next()) m.put(rs.getString("c_prod_no"), rs.getString("c_prod_name"));
        }
        return m;
    }

    private static List<Map<String, Object>> loadScreens(Connection src) throws Exception {
        List<Map<String, Object>> list = new ArrayList<>();
        // 不拉 c_screen_json（大字段），仅轻量字段；车险 JSON 解析时按 screen_no 单独查询
        try (Statement st = src.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT c_screen_no, c_prod_no, c_screen_cname, c_screen_ename, c_screen_content_type, "
                             + "n_show_order FROM tb_prod_rel_screen "
                             + "ORDER BY c_prod_no, c_screen_content_type, n_show_order")) {
            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= cols; i++) row.put(meta.getColumnLabel(i), rs.getObject(i));
                list.add(row);
            }
        }
        return list;
    }

    private static Map<String, List<Elem>> loadAllElements(Connection src, List<Map<String, Object>> screens) throws Exception {
        Map<String, List<Elem>> result = new LinkedHashMap<>();
        Map<String, List<Elem>> tableElems = loadElemsFromTable(src);
        for (Map<String, Object> sc : screens) {
            String screenNo = str(sc, "c_screen_no");
            List<Elem> elems = tableElems.get(screenNo);
            if (elems != null && !elems.isEmpty()) {
                result.put(screenNo, elems);
                continue;
            }
            // 车险：elem 表查不到，按 screen_no 单独查 JSON
            String json = loadScreenJson(src, screenNo);
            if (json != null && !json.isEmpty()) {
                List<Elem> jsonElems = parseFormFields(json);
                if (!jsonElems.isEmpty()) result.put(screenNo, jsonElems);
            }
        }
        return result;
    }

    /** 按 screen_no 查询画面 JSON（仅车险画面需要） */
    private static String loadScreenJson(Connection src, String screenNo) throws Exception {
        try (PreparedStatement ps = src.prepareStatement(
                "SELECT c_screen_json FROM tb_prod_rel_screen WHERE c_screen_no = ?")) {
            ps.setString(1, screenNo);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("c_screen_json");
            }
        }
        return null;
    }

    /**
     * 加载每个画面的列数：
     *   - 非车险：tb_prod_screen_prop.n_columns
     *   - 车险：c_screen_json.config.rowColumns
     */
    private static Map<String, Integer> loadScreenColumns(Connection src, List<Map<String, Object>> screens) throws Exception {
        Map<String, Integer> map = new HashMap<>();
        // 非车险：从 screen_prop 表
        try (Statement st = src.createStatement();
             ResultSet rs = st.executeQuery("SELECT c_screen_no, n_columns FROM tb_prod_screen_prop WHERE n_columns IS NOT NULL")) {
            while (rs.next()) {
                map.put(rs.getString("c_screen_no"), rs.getInt("n_columns"));
            }
        }
        // 车险：从 json.config.rowColumns（仅覆盖未在表里命中的）
        for (Map<String, Object> sc : screens) {
            String screenNo = str(sc, "c_screen_no");
            if (map.containsKey(screenNo)) continue;
            String json = loadScreenJson(src, screenNo);
            if (json == null || json.isEmpty()) continue;
            String rowCols = extractStr(json, "rowColumns");
            if (rowCols != null) {
                Integer v = toInt(rowCols);
                if (v != null) map.put(screenNo, v);
            }
        }
        return map;
    }

    private static Map<String, List<Elem>> loadElemsFromTable(Connection src) throws Exception {
        Map<String, Map<String, Elem>> dedup = new LinkedHashMap<>(); // screenNo -> elemNo -> Elem
        final String baseSql =
                "SELECT c_screen_no, c_elem_no, c_elem_cname, c_elem_ename, c_contrl_type, c_check_type, "
                        + "c_must_input_flag, c_read_only_flag, c_view_show_flag, c_default_value, c_status, "
                        + "n_mini_value, n_maxi_value, n_precision_val, c_codelist_id, n_string_length, "
                        + "c_click_event_func, c_comp_code, n_elem_show_seq_no, c_rel_field_name, c_rel_table_name, "
                        + "c_contrl_attr, c_date_format, c_frontend_event_func, c_read_only_var, "
                        + "c_valid_item_contrl_attr, c_group_flag, c_group_first_item, c_clnt_group, "
                        + "c_default_dropdown_flag, c_title, c_search_url, c_search_param_key, "
                        + "c_search_result_key, c_search_select_event, c_btn_layout "
                        + "FROM tb_prod_screen_rel_elem ORDER BY c_screen_no, n_elem_show_seq_no LIMIT ?, ?";
        int pageSize = 5000;
        int offset = 0;
        while (true) {
            int batch = 0;
            try (PreparedStatement ps = src.prepareStatement(baseSql)) {
                ps.setInt(1, offset);
                ps.setInt(2, pageSize);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Elem e = mapElem(rs, null);
                        String screenNo = rs.getString("c_screen_no");
                        dedup.computeIfAbsent(screenNo, k -> new LinkedHashMap<>()).putIfAbsent(e.elemCode, e);
                        batch++;
                    }
                }
            }
            System.out.println("    已读取元件 " + (offset + batch) + " / 约 203669");
            if (batch < pageSize) break; // 最后一页
            offset += pageSize;
        }
        Map<String, List<Elem>> map = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, Elem>> en : dedup.entrySet()) {
            map.put(en.getKey(), new ArrayList<>(en.getValue().values()));
        }
        return map;
    }

    /** 从 ResultSet 或 formField 对象（key 前缀前缀决定映射）构造 Elem */
    private static Elem mapElem(ResultSet rs, Map<String, Object> m) throws Exception {
        Elem e = new Elem();
        e.elemCode = v(rs, m, "c_elem_no", "elemNo");
        e.elemName = v(rs, m, "c_elem_cname", "elemCname");
        e.elemEname = v(rs, m, "c_elem_ename", "elemEname");
        e.controlType = v(rs, m, "c_contrl_type", "contrlType");
        e.checkType = v(rs, m, "c_check_type", "checkType");
        e.requiredFlag = v(rs, m, "c_must_input_flag", "mustInputFlag");
        e.readonlyFlag = v(rs, m, "c_read_only_flag", "readOnlyFlag");
        e.visibleFlag = v(rs, m, "c_view_show_flag", "viewShowFlag");
        e.defaultVal = v(rs, m, "c_default_value", "defaultValue");
        e.enabledFlag = v(rs, m, "c_status", "status");
        e.minValue = toInt(v(rs, m, "n_mini_value", "miniValue"));
        e.maxValue = toInt(v(rs, m, "n_maxi_value", "maxiValue"));
        e.precision = toInt(v(rs, m, "n_precision_val", "precisionVal"));
        e.codeListName = v(rs, m, "c_codelist_id", "codelistId");
        e.stringLength = toInt(v(rs, m, "n_string_length", "stringLength"));
        e.clickEventFunc = v(rs, m, "c_click_event_func", "eventCname");
        e.compCode = v(rs, m, "c_comp_code", "compCode");
        e.showSeq = toDouble(v(rs, m, "n_elem_show_seq_no", "showSeq"));
        e.relFieldName = v(rs, m, "c_rel_field_name", "relFieldName");
        e.relTableName = v(rs, m, "c_rel_table_name", "relTableName");
        e.controlAttr = v(rs, m, "c_contrl_attr", "contrlAttr");
        e.dateFormat = v(rs, m, "c_date_format", "dateFormat");
        e.frontendEvent = v(rs, m, "c_frontend_event_func", null);
        e.readonlyVar = v(rs, m, "c_read_only_var", null);
        e.validControlAttr = v(rs, m, "c_valid_item_contrl_attr", null);
        e.groupFlag = v(rs, m, "c_group_flag", "groupFlag");
        e.groupFirstItem = v(rs, m, "c_group_first_item", "groupFirstItem");
        e.clientGroup = v(rs, m, "c_clnt_group", null);
        e.autoSelectFirst = v(rs, m, "c_default_dropdown_flag", "defaultDropdownFlag");
        e.tooltipTitle = v(rs, m, "c_title", "title");
        e.searchUrl = v(rs, m, "c_search_url", null);
        e.searchParamKey = v(rs, m, "c_search_param_key", null);
        e.searchResultKey = v(rs, m, "c_search_result_key", null);
        e.searchSelectEvent = v(rs, m, "c_search_select_event", null);
        e.btnLayout = v(rs, m, "c_btn_layout", null);
        return e;
    }

    private static String v(ResultSet rs, Map<String, Object> m, String col, String jsonKey) throws Exception {
        if (rs != null) return rs.getString(col);
        if (m == null || jsonKey == null) return null;
        Object o = m.get(jsonKey);
        return o == null ? null : o.toString();
    }

    /** 解析车险 c_screen_json.formFields[] 为 Elem 列表 */
    private static List<Elem> parseFormFields(String json) {
        List<Elem> list = new ArrayList<>();
        int idx = json.indexOf("\"formFields\"");
        if (idx < 0) return list;
        int arrStart = json.indexOf('[', idx);
        if (arrStart < 0) return list;
        int arrEnd = findMatchingBracket(json, arrStart);
        if (arrEnd < 0) return list;
        String arr = json.substring(arrStart + 1, arrEnd);
        for (String obj : splitJsonObjects(arr)) {
            Map<String, Object> m = new HashMap<>();
            m.put("elemNo", extractStr(obj, "elemNo"));
            m.put("elemCname", extractStr(obj, "elemCname"));
            m.put("elemEname", extractStr(obj, "elemEname"));
            m.put("contrlType", extractStr(obj, "contrlType"));
            m.put("checkType", extractStr(obj, "checkType"));
            m.put("mustInputFlag", extractStr(obj, "mustInputFlag"));
            m.put("readOnlyFlag", extractStr(obj, "readOnlyFlag"));
            m.put("viewShowFlag", extractStr(obj, "viewShowFlag"));
            m.put("defaultValue", extractStr(obj, "defaultValue"));
            m.put("status", extractStr(obj, "status"));
            m.put("miniValue", extractStr(obj, "miniValue"));
            m.put("maxiValue", extractStr(obj, "maxiValue"));
            m.put("precisionVal", extractStr(obj, "precisionVal"));
            m.put("codelistId", extractStr(obj, "codelistId"));
            m.put("stringLength", extractStr(obj, "stringLength"));
            m.put("eventCname", extractStr(obj, "eventCname"));
            m.put("compCode", extractStr(obj, "compCode"));
            m.put("showSeq", extractStr(obj, "showSeq"));
            m.put("relFieldName", extractStr(obj, "relFieldName"));
            m.put("relTableName", extractStr(obj, "relTableName"));
            m.put("contrlAttr", extractStr(obj, "contrlAttr"));
            m.put("dateFormat", extractStr(obj, "dateFormat"));
            m.put("groupFlag", extractStr(obj, "groupFlag"));
            m.put("groupFirstItem", extractStr(obj, "groupFirstItem"));
            m.put("defaultDropdownFlag", extractStr(obj, "defaultDropdownFlag"));
            m.put("title", extractStr(obj, "title"));
            try {
                Elem e = mapElem(null, m);
                if (e.elemCode != null && !e.elemCode.isEmpty()) list.add(e);
            } catch (Exception ex) { /* skip */ }
        }
        return list;
    }

    // ---------- 元件定义（全局模板） ----------

    private static int writeElementDefs(Connection dst, Map<String, List<Elem>> screenElems) throws Exception {
        String sql = "INSERT INTO tb_canvas_element "
                + "(c_pk_id, c_canvas_code, c_elem_code, c_elem_name, c_elem_ename, c_control_type, "
                + "c_check_type, c_required_flag, c_readonly_flag, c_visible_flag, c_default_value, "
                + "c_enabled_flag, c_min_value, c_max_value, c_precision, c_code_list_name, n_string_length, "
                + "c_click_event_func, c_comp_code, n_elem_show_seq, c_rel_field_name, c_rel_table_name, "
                + "c_control_attr, c_date_format, c_frontend_event, c_readonly_var, c_valid_control_attr, "
                + "c_group_flag, c_group_first_item, c_client_group, c_auto_select_first, c_tooltip_title, "
                + "c_search_url, c_search_param_key, c_search_result_key, c_search_select_event, "
                + "c_system_code, c_template_code, c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time) "
                + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        // elemNo -> { sample Elem, controlType 频次 }
        Map<String, Elem> sample = new LinkedHashMap<>();
        Map<String, Map<String, Integer>> typeCount = new HashMap<>();
        for (List<Elem> elems : screenElems.values()) {
            for (Elem e : elems) {
                sample.putIfAbsent(e.elemCode, e);
                Map<String, Integer> tc = typeCount.computeIfAbsent(e.elemCode, k -> new HashMap<>());
                String ct = e.controlType == null ? "text" : e.controlType;
                tc.put(ct, tc.getOrDefault(ct, 0) + 1);
            }
        }

        int cnt = 0;
        try (PreparedStatement ps = dst.prepareStatement(sql)) {
            for (Map.Entry<String, Elem> en : sample.entrySet()) {
                Elem e = en.getValue();
                String bestType = e.controlType == null ? "text" : e.controlType;
                Map<String, Integer> tc = typeCount.get(en.getKey());
                if (tc != null) {
                    int max = -1;
                    for (Map.Entry<String, Integer> te : tc.entrySet())
                        if (te.getValue() > max) { max = te.getValue(); bestType = te.getKey(); }
                }
                int i = 1;
                ps.setString(i++, nextId());
                ps.setString(i++, "");                       // c_canvas_code=''（元件定义）
                ps.setString(i++, e.elemCode);
                ps.setString(i++, e.elemName);
                ps.setString(i++, e.elemEname);
                ps.setString(i++, bestType);                 // c_control_type 取众数
                ps.setString(i++, e.checkType);
                ps.setString(i++, e.requiredFlag);
                ps.setString(i++, "0");                      // 定义层不强制只读
                ps.setString(i++, "1");
                ps.setString(i++, e.defaultVal);
                ps.setString(i++, "1");
                ps.setObject(i++, e.minValue);
                ps.setObject(i++, e.maxValue);
                ps.setObject(i++, e.precision);
                ps.setString(i++, e.codeListName);
                ps.setObject(i++, e.stringLength);
                ps.setString(i++, e.clickEventFunc);
                ps.setString(i++, e.compCode);
                ps.setObject(i++, null);                     // n_elem_show_seq
                ps.setString(i++, e.relFieldName);
                ps.setString(i++, e.relTableName);
                ps.setString(i++, e.controlAttr);
                ps.setString(i++, e.dateFormat);
                ps.setString(i++, e.frontendEvent);
                ps.setString(i++, e.readonlyVar);
                ps.setString(i++, e.validControlAttr);
                ps.setString(i++, e.groupFlag);
                ps.setString(i++, e.groupFirstItem);
                ps.setString(i++, e.clientGroup);
                ps.setString(i++, e.autoSelectFirst);
                ps.setString(i++, e.tooltipTitle);
                ps.setString(i++, e.searchUrl);
                ps.setString(i++, e.searchParamKey);
                ps.setString(i++, e.searchResultKey);
                ps.setString(i++, e.searchSelectEvent);
                ps.setString(i++, SYSTEM_CODE);
                ps.setString(i++, null);
                ps.setString(i++, "sync");
                ps.setString(i++, "sync");
                ps.setString(i++, now());
                ps.setString(i++, now());
                ps.addBatch();
                cnt++;
                if (cnt % 2000 == 0) ps.executeBatch();
            }
            ps.executeBatch();
        }
        return cnt;
    }

    // ---------- 组件（产品专属实例） ----------

    private static int writeComponents(Connection dst, List<Map<String, Object>> screens,
                                       Map<String, List<Elem>> screenElems,
                                       Map<String, Integer> screenColumns) throws Exception {
        String sql = "INSERT INTO tb_element_group "
                + "(c_pk_id, c_group_code, c_group_name, c_group_desc, c_group_type, c_group_tag, "
                + "c_system_code, c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time, c_elements_json) "
                + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        int cnt = 0;
        try (PreparedStatement ps = dst.prepareStatement(sql)) {
            for (Map<String, Object> sc : screens) {
                String screenNo = str(sc, "c_screen_no");
                String screenName = str(sc, "c_screen_cname");
                String prodNo = str(sc, "c_prod_no");
                String contentType = str(sc, "c_screen_content_type");
                List<Elem> elems = screenElems.get(screenNo);
                if (elems == null || elems.isEmpty()) continue; // 无元件画面跳过

                ps.setString(1, nextId());
                ps.setString(2, screenNo);                 // c_group_code = c_screen_no（唯一，产品专属）
                ps.setString(3, screenName);
                ps.setString(4, "产品:" + prodNo + " 画面组件");
                ps.setString(5, "form");
                ps.setString(6, prodNo);                    // c_group_tag 存产品号（回写/过滤用）
                ps.setString(7, SYSTEM_CODE);
                ps.setString(8, "sync");
                ps.setString(9, "sync");
                ps.setString(10, now());
                ps.setString(11, now());
                int cols = screenColumns.getOrDefault(screenNo, 1);
                ps.setString(12, componentsJson(elems, cols));
                ps.addBatch();
                cnt++;
                if (cnt % 2000 == 0) ps.executeBatch();
            }
            ps.executeBatch();
        }
        return cnt;
    }

    private static String componentsJson(List<Elem> elems, int columns) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"columns\":").append(columns).append(",\"elements\":[");
        for (int i = 0; i < elems.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(elementJson(elems.get(i)));
        }
        sb.append("]}");
        return sb.toString();
    }

    // ---------- 画布（产品页面） ----------

    private static int writeCanvases(Connection dst, List<Map<String, Object>> screens,
                                     Map<String, List<Elem>> screenElems,
                                     Map<String, Integer> screenColumns,
                                     Map<String, String> prodNameMap) throws Exception {
        String sql = "INSERT INTO tb_canvas "
                + "(c_pk_id, c_canvas_code, c_canvas_name, c_canvas_ename, c_canvas_type, "
                + "c_canvas_json, n_show_order, c_rel_js_file, c_base_flag, c_system_code, "
                + "c_page_code, c_template_code, c_remark, c_crtr_code, c_uptr_code, d_crtr_time, d_uptr_time) "
                + "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        // 按 (prodNo, contentType) 分组，组内按 n_show_order 排序
        Map<String, List<Map<String, Object>>> pageMap = new LinkedHashMap<>();
        for (Map<String, Object> sc : screens) {
            String key = str(sc, "c_prod_no") + "_" + str(sc, "c_screen_content_type");
            pageMap.computeIfAbsent(key, k -> new ArrayList<>()).add(sc);
        }

        int cnt = 0;
        try (PreparedStatement ps = dst.prepareStatement(sql)) {
            for (Map.Entry<String, List<Map<String, Object>>> en : pageMap.entrySet()) {
                String key = en.getKey();
                List<Map<String, Object>> pageScreens = en.getValue();
                String prodNo = key.substring(0, key.indexOf('_'));
                String contentType = key.substring(key.indexOf('_') + 1);
                String pageName = prodNameMap.getOrDefault(prodNo, prodNo)
                        + ("1".equals(contentType) ? "-投保页" : "-报价页");

                String canvasJson = buildCanvasJson(pageScreens, screenElems, screenColumns);
                if (canvasJson == null) continue;

                ps.setString(1, nextId());
                ps.setString(2, key);
                ps.setString(3, pageName);
                ps.setString(4, null);
                ps.setString(5, "form");
                ps.setString(6, canvasJson);
                ps.setInt(7, 0);
                ps.setString(8, null);
                ps.setString(9, "0");
                ps.setString(10, SYSTEM_CODE);
                ps.setString(11, prodNo);
                ps.setString(12, null);
                ps.setString(13, "产品工厂同步");
                ps.setString(14, "sync");
                ps.setString(15, "sync");
                ps.setString(16, now());
                ps.setString(17, now());
                ps.addBatch();
                cnt++;
                if (cnt % 100 == 0) ps.executeBatch();
            }
            ps.executeBatch();
        }
        return cnt;
    }

    /** 画布 JSON：items 按顺序放 component item，refCode = c_screen_no（即组件 code），compColumns 取画面真实列数 */
    private static String buildCanvasJson(List<Map<String, Object>> pageScreens,
                                          Map<String, List<Elem>> screenElems,
                                          Map<String, Integer> screenColumns) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"canvasType\":\"form\",\"contentType\":\"")
          .append(str(pageScreens.get(0), "c_screen_content_type"))
          .append("\",\"columns\":1,\"items\":[");
        boolean first = true;
        for (Map<String, Object> sc : pageScreens) {
            String screenNo = str(sc, "c_screen_no");
            String screenName = str(sc, "c_screen_cname");
            List<Elem> elems = screenElems.get(screenNo);
            if (elems == null || elems.isEmpty()) continue;
            if (!first) sb.append(",");
            first = false;
            int cols = screenColumns.getOrDefault(screenNo, 1);
            sb.append("{\"itemType\":\"component\",\"refCode\":\"").append(escapeJson(screenNo))
              .append("\",\"refName\":\"").append(escapeJson(screenName == null ? "" : screenName))
              .append("\",\"compColumns\":").append(cols).append(",\"childElements\":[");
            for (int i = 0; i < elems.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(elementJson(elems.get(i)));
            }
            sb.append("]}");
        }
        sb.append("],\"buttons\":[");
        // 页面级按钮（产品工厂硬编码的：暂存/计算/提核）
        sb.append("{\"btn_name\":\"暂存\",\"btn_code\":\"tempSave\",\"btn_event_type\":\"save\"},");
        sb.append("{\"btn_name\":\"计算\",\"btn_code\":\"calculate\",\"btn_event_type\":\"calculate\"},");
        sb.append("{\"btn_name\":\"提核\",\"btn_code\":\"verify\",\"btn_event_type\":\"verify\"}");
        sb.append("]}");
        return first ? null : sb.toString();
    }

    // ---------- 元件 JSON ----------

    private static String elementJson(Elem e) {
        StringBuilder sb = new StringBuilder("{");
        kv(sb, "control_type", e.controlType);
        kv(sb, "elem_code", e.elemCode);
        kv(sb, "elem_name", e.elemName);
        kv(sb, "elem_ename", e.elemEname);
        kv(sb, "rel_field_name", e.relFieldName);
        kv(sb, "rel_table_name", e.relTableName);
        kv(sb, "required_flag", e.requiredFlag);
        kv(sb, "readonly_flag", e.readonlyFlag);
        kv(sb, "visible_flag", e.visibleFlag);
        kv(sb, "enabled_flag", e.enabledFlag);
        kv(sb, "default_value", e.defaultVal);
        kv(sb, "tooltip_title", e.tooltipTitle);
        kv(sb, "check_type", e.checkType);
        kv(sb, "code_list_name", e.codeListName);
        kv(sb, "control_attr", e.controlAttr);
        kv(sb, "btn_layout", e.btnLayout);
        if (e.minValue != null) kn(sb, "min_value", e.minValue);
        if (e.maxValue != null) kn(sb, "max_value", e.maxValue);
        if (e.stringLength != null) kn(sb, "string_length", e.stringLength);
        if (sb.charAt(sb.length() - 1) == ',') sb.setLength(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }

    // ---------- 核对 ----------

    private static void verify(Connection dst) throws Exception {
        try (Statement s = dst.createStatement()) {
            printCount(s, "tb_canvas");
            printCount(s, "tb_canvas_element");
            printCount(s, "tb_canvas_config");
            printCount(s, "tb_element_group");
            printCount(s, "tb_element_group_item");
            printCount(s, "tb_page_template");
            printCount(s, "tb_canvas_publish");
            printCount(s, "tb_canvas_button");
        }
    }

    private static void printCount(Statement s, String table) throws Exception {
        try (ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM " + table)) {
            rs.next();
            System.out.println("  " + table + " = " + rs.getLong(1));
        }
    }

    // ---------- 工具 ----------

    private static String now() {
        return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : v.toString();
    }

    private static Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    private static Double toDouble(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).doubleValue();
        try { return Double.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    private static String extractStr(String obj, String key) {
        String pat = "\"" + key + "\"";
        int i = obj.indexOf(pat);
        if (i < 0) return null;
        int colon = obj.indexOf(':', i + pat.length());
        if (colon < 0) return null;
        int j = colon + 1;
        while (j < obj.length() && (obj.charAt(j) == ' ' || obj.charAt(j) == '\t')) j++;
        if (j >= obj.length()) return null;
        char c = obj.charAt(j);
        if (c == '"') {
            int end = obj.indexOf('"', j + 1);
            if (end < 0) return null;
            return unescape(obj.substring(j + 1, end));
        }
        int end = j;
        while (end < obj.length() && ",}]".indexOf(obj.charAt(end)) < 0) end++;
        String val = obj.substring(j, end).trim();
        return val.equals("null") ? null : val;
    }

    private static String unescape(String s) {
        return s.replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private static int findMatchingBracket(String s, int arrStart) {
        int depth = 0;
        boolean inStr = false;
        for (int i = arrStart; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' && (i == 0 || s.charAt(i - 1) != '\\')) inStr = !inStr;
            if (inStr) continue;
            if (c == '[') depth++;
            else if (c == ']') { depth--; if (depth == 0) return i; }
        }
        return -1;
    }

    private static List<String> splitJsonObjects(String arr) {
        List<String> list = new ArrayList<>();
        int depth = 0;
        boolean inStr = false;
        int start = -1;
        for (int i = 0; i < arr.length(); i++) {
            char c = arr.charAt(i);
            if (c == '"' && (i == 0 || arr.charAt(i - 1) != '\\')) inStr = !inStr;
            if (inStr) continue;
            if (c == '{') { if (depth == 0) start = i; depth++; }
            else if (c == '}') {
                depth--;
                if (depth == 0 && start >= 0) { list.add(arr.substring(start, i + 1)); start = -1; }
            }
        }
        return list;
    }

    private static void kv(StringBuilder sb, String key, String val) {
        if (val == null) return;
        sb.append("\"").append(key).append("\":\"").append(escapeJson(val)).append("\",");
    }

    private static void kn(StringBuilder sb, String key, Number val) {
        sb.append("\"").append(key).append("\":").append(val).append(",");
    }

    private static String escapeJson(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        return sb.toString();
    }
}
