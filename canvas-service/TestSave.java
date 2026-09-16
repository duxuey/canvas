import java.sql.*;

public class TestSave {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/core_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai";
        try (Connection c = DriverManager.getConnection(url, "root", "123456");
             Statement s = c.createStatement()) {

            // Insert a test template with Chinese
            s.execute("INSERT INTO tb_page_template (c_pk_id, c_template_code, c_template_name, c_template_desc, c_template_type, c_del_flag, c_system_code) " +
                      "VALUES ('999', 'TEST_CN', '测试模板', '测试描述中文', 'page', '0', 'SYS01') " +
                      "ON DUPLICATE KEY UPDATE c_template_name='测试模板'");
            System.out.println("Inserted test template");

            // Read it back and verify
            try (ResultSet rs = s.executeQuery(
                "SELECT c_template_name, HEX(c_template_name), c_template_desc " +
                "FROM tb_page_template WHERE c_template_code='TEST_CN'")) {
                if (rs.next()) {
                    String name = rs.getString(1);
                    String hex = rs.getString(2);
                    String desc = rs.getString(3);
                    System.out.println("Name: " + name);
                    System.out.println("Name Hex: " + hex);
                    System.out.println("Desc: " + desc);
                    // Verify against expected UTF-8 hex for "测试模板"
                    String expectedHex = "E6B58BE8AF95E6A8A1E69DBF";
                    System.out.println("Expected hex: " + expectedHex);
                    System.out.println("MATCH: " + hex.equalsIgnoreCase(expectedHex));
                }
            }

            // Clean up
            s.execute("DELETE FROM tb_page_template WHERE c_template_code='TEST_CN'");
            System.out.println("Cleaned up test data");

            // Also verify the table structure shows correct comments
            System.out.println("\n=== SHOW CREATE TABLE tb_page_template (column comments) ===");
            try (ResultSet rs = s.executeQuery(
                "SELECT COLUMN_NAME, COLUMN_COMMENT FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA='core_db' AND TABLE_NAME='tb_page_template' ORDER BY ORDINAL_POSITION")) {
                while (rs.next()) {
                    String col = rs.getString(1);
                    String comment = rs.getString(2);
                    if (comment != null && !comment.isEmpty()) {
                        System.out.println("  " + col + " -> " + comment);
                    }
                }
            }
        }
    }
}
