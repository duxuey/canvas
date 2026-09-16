import java.sql.*;

public class CheckMySQL {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai";
        try (Connection c = DriverManager.getConnection(url, "root", "123456");
             Statement s = c.createStatement()) {

            System.out.println("MySQL version: " + getVar(s, "SELECT VERSION()"));

            // Where is my.ini?
            String basedir = getVar(s, "SELECT @@basedir");
            String datadir = getVar(s, "SELECT @@datadir");
            System.out.println("basedir: " + basedir);
            System.out.println("datadir: " + datadir);

            // Check for my.ini in common locations
            String[] possible = {
                basedir + "\\my.ini",
                basedir + "\\my.cnf",
                "C:\\Windows\\my.ini",
                "C:\\Windows\\my.cnf",
                datadir + "\\my.ini",
            };
            System.out.println("\nLooking for my.ini/my.cnf:");
            for (String path : possible) {
                java.io.File f = new java.io.File(path);
                System.out.println("  " + path + " -> " + (f.exists() ? "EXISTS" : "not found"));
            }

            // Check current character_set_server
            System.out.println("\nKey variables:");
            String[] vars = {"character_set_server","collation_server","character_set_database",
                "collation_database","sql_mode","innodb_large_prefix"};
            for (String v : vars) {
                System.out.println("  " + v + " = " + getVar(s, "SELECT @@" + v));
            }
        }
    }
    static String getVar(Statement s, String sql) {
        try { ResultSet rs = s.executeQuery(sql); rs.next(); return rs.getString(1); }
        catch (Exception e) { return "ERROR: " + e.getMessage(); }
    }
}
