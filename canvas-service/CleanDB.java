import java.sql.*;

public class CleanDB {
  public static void main(String[] a) throws Exception {
    Class.forName("com.mysql.cj.jdbc.Driver");
    Connection c = DriverManager.getConnection(
      "jdbc:mysql://localhost:3306/core_db?useSSL=false&serverTimezone=Asia/Shanghai", "root", "123456");
    String[] tables = {"tb_canvas","tb_canvas_config","tb_canvas_element","tb_canvas_button",
      "tb_page_template","tb_element_group","tb_element_group_item"};
    for (String t : tables) {
      try { c.createStatement().executeUpdate("DELETE FROM " + t); System.out.println("Cleaned: " + t); }
      catch (Exception e) { System.out.println("Skip: " + t); }
    }
    c.close();
  }
}
