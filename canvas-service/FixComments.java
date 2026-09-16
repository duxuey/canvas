import java.sql.*;
import java.util.*;

/**
 * Fix garbled table/column comments in MySQL caused by charset mismatch.
 * Strategy: use information_schema to read each column's definition, then
 * MODIFY COLUMN with the SAME type but new COMMENT.
 */
public class FixComments {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/core_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai";
        String user = "root";
        String pass = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {

            // Fix table-level comments
            System.out.println("=== Fixing Table Comments ===");
            Map<String, String> tableComments = new LinkedHashMap<>();
            tableComments.put("tb_canvas",             "画布定义表");
            tableComments.put("tb_canvas_element",      "画布元素表");
            tableComments.put("tb_canvas_config",       "画布配置表");
            tableComments.put("tb_canvas_button",       "画布按钮表");
            tableComments.put("tb_page_template",       "页面模板表");
            tableComments.put("tb_element_group",       "元素分组表");
            tableComments.put("tb_element_group_item",  "元素分组明细表");

            for (Map.Entry<String, String> e : tableComments.entrySet()) {
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute("ALTER TABLE `" + e.getKey() + "` COMMENT='" + e.getValue() + "'");
                    System.out.println("[OK] " + e.getKey() + " -> " + e.getValue());
                }
            }

            // Fix column comments - read each column from information_schema and rebuild
            System.out.println("\n=== Fixing Column Comments ===");
            for (String tableName : tableComments.keySet()) {
                List<ColDef> cols = new ArrayList<>();

                // Read column definitions
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery(
                         "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, " +
                         "EXTRA, COLUMN_COMMENT, ORDINAL_POSITION " +
                         "FROM information_schema.COLUMNS " +
                         "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME='" + tableName + "' " +
                         "ORDER BY ORDINAL_POSITION")) {
                    while (rs.next()) {
                        ColDef c = new ColDef();
                        c.name = rs.getString("COLUMN_NAME");
                        c.type = rs.getString("COLUMN_TYPE");
                        c.nullable = "YES".equals(rs.getString("IS_NULLABLE"));
                        c.defaultVal = rs.getString("COLUMN_DEFAULT");
                        c.extra = rs.getString("EXTRA");
                        c.comment = rs.getString("COLUMN_COMMENT");
                        cols.add(c);
                    }
                }

                for (ColDef c : cols) {
                    // Build MODIFY COLUMN
                    StringBuilder sb = new StringBuilder();
                    sb.append("ALTER TABLE `").append(tableName).append("` MODIFY COLUMN `")
                      .append(c.name).append("` ").append(c.type)
                      .append(" CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

                    if (!c.nullable) sb.append(" NOT NULL");

                    if (c.defaultVal != null) {
                        if ("CURRENT_TIMESTAMP".equalsIgnoreCase(c.defaultVal) ||
                            c.defaultVal.contains("current_timestamp")) {
                            sb.append(" DEFAULT ").append(c.defaultVal);
                        } else {
                            sb.append(" DEFAULT '").append(c.defaultVal.replace("'", "''")).append("'");
                        }
                    }

                    if (c.extra != null && !c.extra.isEmpty()) {
                        sb.append(" ").append(c.extra);
                    }

                    // Keep original comment but ensure it's stored with correct charset
                    // (MODIFY COLUMN forces re-encoding)
                    String comment = c.comment != null ? c.comment.replace("'", "''") : "";
                    sb.append(" COMMENT '").append(comment).append("'");

                    try (Statement stmt = conn.createStatement()) {
                        stmt.execute(sb.toString());
                    } catch (SQLException ex) {
                        System.out.println("[FAIL] " + tableName + "." + c.name + ": " + ex.getMessage());
                    }
                }
                System.out.println("[DONE] " + tableName + " (" + cols.size() + " columns)");
            }

            // Verify
            System.out.println("\n=== Verify ===");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                     "SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES " +
                     "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME LIKE 'tb_%'")) {
                while (rs.next()) {
                    System.out.printf("%-30s %s%n", rs.getString(1), rs.getString(2));
                }
            }

            System.out.println("\n=== Done ===");
        }
    }

    static class ColDef {
        String name, type, defaultVal, extra, comment;
        boolean nullable;
    }
}
