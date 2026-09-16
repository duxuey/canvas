import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Fix MySQL database/table charset for proper Chinese character support.
 */
public class FixCharset {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/core_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai";
        String user = "root";
        String pass = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {

            // 1. Check database charset
            System.out.println("=== Database Charset ===");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                     "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME " +
                     "FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='core_db'")) {
                if (rs.next()) {
                    System.out.println("Database charset: " + rs.getString(1));
                    System.out.println("Database collation: " + rs.getString(2));
                }
            }

            // 2. Check table charsets (collect first, then process)
            System.out.println("\n=== Table Charsets (Before) ===");
            List<String> tables = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                     "SELECT TABLE_NAME, TABLE_COLLATION, TABLE_COMMENT " +
                     "FROM information_schema.TABLES " +
                     "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME LIKE 'tb_%'")) {
                while (rs.next()) {
                    String t = rs.getString(1);
                    tables.add(t);
                    System.out.printf("%-30s %-25s %s%n", t, rs.getString(2), rs.getString(3));
                }
            }
            System.out.println("Found " + tables.size() + " tables");

            // 3. FIX: Alter database charset to utf8mb4
            System.out.println("\n=== Fixing Database Charset ===");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("ALTER DATABASE core_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                System.out.println("Database charset changed to utf8mb4");
            }

            // 4. FIX: Convert each table to utf8mb4 (use fresh Statement each time)
            System.out.println("\n=== Fixing Table Charsets ===");
            for (String table : tables) {
                try (Statement stmt = conn.createStatement()) {
                    String sql = "ALTER TABLE `" + table + "` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
                    stmt.execute(sql);
                    System.out.println("[OK] " + sql);
                } catch (SQLException e) {
                    System.out.println("[FAIL] " + table + ": " + e.getMessage());
                }
            }

            // 5. Verify: re-run SHOW CREATE TABLE to check comment readability
            System.out.println("\n=== After Fix: SHOW CREATE TABLE tb_page_template ===");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SHOW CREATE TABLE tb_page_template")) {
                if (rs.next()) {
                    String ddl = rs.getString(2);
                    // Print first 1000 chars
                    System.out.println(ddl.substring(0, Math.min(1000, ddl.length())));
                }
            }

            // 6. Verify comment readability
            System.out.println("\n=== After Fix: Table Comments ===");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                     "SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES " +
                     "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME LIKE 'tb_%'")) {
                while (rs.next()) {
                    System.out.printf("%-30s %s%n", rs.getString(1), rs.getString(2));
                }
            }

            System.out.println("\n=== Done - Database charset fixed to utf8mb4 ===");
        }
    }
}
