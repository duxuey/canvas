import java.sql.*;

public class ResetPwd {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection c = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306?useSSL=false&serverTimezone=Asia/Shanghai", "root", "");
        c.createStatement().execute("FLUSH PRIVILEGES");
        c.createStatement().execute("SET PASSWORD FOR 'root'@'localhost' = PASSWORD('123456')");
        c.createStatement().execute("FLUSH PRIVILEGES");
        System.out.println("Password reset to 123456");
        c.close();
    }
}
