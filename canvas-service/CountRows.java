import java.sql.*;

public class CountRows {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/core_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai";
        try (Connection c = DriverManager.getConnection(url, "root", "123456");
             Statement s = c.createStatement()) {
            String[] tables = {"tb_canvas","tb_canvas_element","tb_canvas_config",
                "tb_canvas_button","tb_page_template","tb_element_group","tb_element_group_item"};
            for (String t : tables) {
                try (ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM `" + t + "`")) {
                    rs.next();
                    System.out.println(t + ": " + rs.getInt(1) + " rows");
                } catch (SQLException e) {
                    System.out.println(t + ": ERROR - " + e.getMessage());
                }
            }
        }
    }
}
