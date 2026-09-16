import java.sql.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

/**
 * Rebuild all tables from schema.sql (MySQL 5.5 compatible).
 */
public class RebuildTables {
    static String url = "jdbc:mysql://localhost:3306/core_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowMultiQueries=true";
    static String user = "root";
    static String pass = "123456";

    public static void main(String[] args) throws Exception {
        try (Connection c = DriverManager.getConnection(url, user, pass);
             Statement stmt = c.createStatement()) {

            // Ensure session charset is utf8 for proper Chinese handling
            stmt.execute("SET NAMES utf8mb4");
            System.out.println("SET NAMES utf8mb4");

            // Drop existing tables if any
            System.out.println("\n=== Dropping existing tables ===");
            String[] DROP_ORDER = {
                "tb_element_group_item", "tb_element_group", "tb_canvas_button",
                "tb_canvas_config", "tb_canvas_element", "tb_canvas", "tb_page_template",
            };
            stmt.execute("SET FOREIGN_KEY_CHECKS=0");
            for (String table : DROP_ORDER) {
                try { stmt.execute("DROP TABLE IF EXISTS `" + table + "`");
                      System.out.println("  Dropped: " + table); }
                catch (SQLException e) { System.out.println("  Skip: " + table); }
            }
            stmt.execute("SET FOREIGN_KEY_CHECKS=1");

            // Execute schema.sql
            System.out.println("\n=== Creating tables from schema.sql ===");
            String schema = new String(Files.readAllBytes(
                Paths.get("canvas-core/src/main/resources/db/schema.sql")), "UTF-8");
            List<String> creates = extractCreateTables(schema);
            for (String create : creates) {
                try {
                    stmt.execute(create);
                    Matcher m = Pattern.compile("CREATE TABLE.*?`(\\w+)`").matcher(create);
                    if (m.find()) System.out.println("  Created: " + m.group(1));
                } catch (SQLException e) {
                    System.err.println("  FAIL: " + e.getMessage().substring(0, Math.min(150, e.getMessage().length())));
                    System.err.println("  SQL: " + create.substring(0, Math.min(100, create.length())));
                }
            }

            // Verify: show table comments
            System.out.println("\n=== Table Comments ===");
            try (ResultSet rs = stmt.executeQuery(
                "SELECT TABLE_NAME, TABLE_COMMENT, TABLE_COLLATION FROM information_schema.TABLES " +
                "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME LIKE 'tb_%' ORDER BY TABLE_NAME")) {
                while (rs.next())
                    System.out.printf("  %-30s %-25s %s%n", rs.getString(1), rs.getString(3), rs.getString(2));
            }

            // Verify: DDL for one table (show Chinese comments readable)
            System.out.println("\n=== DDL: tb_page_template (first 600 chars) ===");
            try (ResultSet rs = stmt.executeQuery("SHOW CREATE TABLE tb_page_template")) {
                if (rs.next()) System.out.println(rs.getString(2).substring(0, 600));
            }

            System.out.println("\n=== Done ===");
        }
    }

    static List<String> extractCreateTables(String schema) {
        List<String> result = new ArrayList<>();
        String[] parts = schema.split("(?i)CREATE TABLE");
        for (int i = 1; i < parts.length; i++) {
            String part = "CREATE TABLE" + parts[i];
            Matcher m = Pattern.compile(".*?\\)\\s*ENGINE[^;]*;", Pattern.DOTALL).matcher(part);
            if (m.find()) result.add(m.group().trim());
        }
        return result;
    }
}
