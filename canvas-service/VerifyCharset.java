import java.sql.*;
import java.io.*;

public class VerifyCharset {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/core_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai";
        try (Connection c = DriverManager.getConnection(url, "root", "123456");
             Statement s = c.createStatement()) {

            // Get table comment as bytes to verify encoding
            try (ResultSet rs = s.executeQuery(
                "SELECT TABLE_NAME, TABLE_COMMENT, HEX(TABLE_COMMENT) " +
                "FROM information_schema.TABLES " +
                "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME='tb_page_template'")) {
                if (rs.next()) {
                    String comment = rs.getString(2);
                    String hex = rs.getString(3);
                    System.out.println("Table comment: [" + comment + "]");
                    System.out.println("Hex: " + hex);
                    // Expected: 页面模板表 = E9A1B5E99DA2E6A8A1E69DBFE8A1A8
                    System.out.println("Expected: E9A1B5E99DA2E6A8A1E69DBFE8A1A8");
                    System.out.println("Match: " + hex.equalsIgnoreCase("E9A1B5E99DA2E6A8A1E69DBFE8A1A8"));
                }
            }

            // Also write SHOW CREATE TABLE to file to bypass console encoding
            try (ResultSet rs = s.executeQuery("SHOW CREATE TABLE tb_page_template")) {
                if (rs.next()) {
                    String ddl = rs.getString(2);
                    // Write to file as UTF-8
                    try (OutputStreamWriter w = new OutputStreamWriter(
                        new FileOutputStream("ddl_output.txt"), "UTF-8")) {
                        w.write(ddl);
                    }
                    System.out.println("\nFull DDL written to ddl_output.txt (UTF-8)");

                    // Check first 15 chars
                    String prefix = ddl.substring(0, Math.min(200, ddl.length()));
                    System.out.println("First 200 chars of DDL:");
                    System.out.println(prefix);
                }
            }

            // Check all table comments with hex
            System.out.println("\n=== All Table Comments ===");
            try (ResultSet rs = s.executeQuery(
                "SELECT TABLE_NAME, TABLE_COMMENT, HEX(TABLE_COMMENT) " +
                "FROM information_schema.TABLES " +
                "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME LIKE 'tb_%' ORDER BY TABLE_NAME")) {
                while (rs.next()) {
                    String name = rs.getString(1);
                    String comment = rs.getString(2);
                    String hex = rs.getString(3);
                    // Check if hex looks like valid UTF-8 Chinese
                    boolean looksGood = !hex.equals("3F") && !hex.equals("3F3F") &&
                        !hex.contains("3F3F");
                    System.out.printf("%-30s hex=%-30s ok=%s%n", name,
                        hex != null ? hex.substring(0, Math.min(30, hex.length())) : "NULL", looksGood);
                }
            }
        }
    }
}
