import java.sql.*;

public class DebugDB {
  public static void main(String[] a) throws Exception {
    Class.forName("com.mysql.cj.jdbc.Driver");
    Connection c = DriverManager.getConnection(
      "jdbc:mysql://localhost:3306/core_db?useSSL=false", "root", "123456");
    ResultSet rs = c.createStatement().executeQuery("SELECT * FROM tb_page_template");
    ResultSetMetaData md = rs.getMetaData();
    int cols = md.getColumnCount();
    System.out.println("Columns: " + cols);
    for (int i = 1; i <= cols; i++) System.out.println("  " + i + ": " + md.getColumnName(i) + " (" + md.getColumnTypeName(i) + ")");
    while (rs.next()) {
      System.out.println("--- Row ---");
      for (int i = 1; i <= cols; i++) {
        System.out.println("  " + md.getColumnName(i) + " = " + rs.getString(i));
      }
    }
    c.close();
  }
}
